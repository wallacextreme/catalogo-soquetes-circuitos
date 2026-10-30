#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
scripts/extract_word_catalogs.py
Engenharia Reversa Automatizada de Catálogos Word (.doc OLE2 / .docx OpenXML)
para Placas de Circuito de Lanterna e Soquetes Diversos.

- Conversão automática .doc -> .docx via Word COM / Fallback
- Extração de tabelas de 6 colunas (Slot Esquerdo e Direito)
- Extração precisa de Códigos Rainha das Sete, TC Chicotes, DPaula, OEM e Códigos Cruzados
- Extração de Especificações de Placas (LD / LE / Par, Montadora, Lanterna Arteb/Cibié)
- Extração de Especificações de Soquetes (1 Polo / 2 Polos, H1/H4/H7, Pingo T10, Porcelana, etc.)
- Processamento Studio .WebP com fundo branco puro (#FFFFFF) e Smart Trim via webp_studio_converter
- Geração do seed master src/data/catalog-master-seed.json
"""

import os
import sys
import json
import re
import shutil
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple
import xml.etree.ElementTree as ET

# Garante import do webp_studio_converter
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

from webp_studio_converter import convert_bytes_to_studio_webp, audit_webp_image

try:
    import docx
except ImportError:
    print("[ERRO] python-docx não instalado.")
    sys.exit(1)


# ============================================================================
# 1. CONVERSÃO AUTOMÁTICA .DOC -> .DOCX EM CACHE
# ============================================================================

def convert_doc_to_docx_if_needed(doc_path: Path, output_dir: Path) -> Path:
    """
    Verifica magic bytes. Se for OLE2 binary (.doc), converte para .docx usando Word COM.
    Se já for OpenXML ou se o .docx já estiver em cache com timestamp recente, aproveita.
    """
    output_dir.mkdir(parents=True, exist_ok=True)
    target_docx = output_dir / f"{doc_path.stem}.docx"

    with open(doc_path, "rb") as f:
        magic = f.read(4)

    # Se já é docx (PK..)
    if magic == b"PK\x03\x04":
        return doc_path

    # Se for binário OLE2 (D0 CF 11 E0)
    if magic == b"\xd0\xcf\x11\xe0":
        if target_docx.exists() and target_docx.stat().st_size > 10000:
            if target_docx.stat().st_mtime >= doc_path.stat().st_mtime:
                print(f"[CACHE] Usando docx existente: {target_docx.name}")
                return target_docx

        print(f"[CONVERSÃO] Convertendo {doc_path.name} para DOCX via Word COM...")
        try:
            import win32com.client
            word = win32com.client.Dispatch("Word.Application")
            word.Visible = False
            word.DisplayAlerts = False
            doc = word.Documents.Open(str(doc_path.resolve()), ReadOnly=True)
            doc.SaveAs2(str(target_docx.resolve()), FileFormat=16) # wdFormatXMLDocument = 16
            doc.Close(SaveChanges=False)
            word.Quit()
            print(f"[OK] Convertido com sucesso: {target_docx.name} ({target_docx.stat().st_size} bytes)")
            return target_docx
        except Exception as e:
            print(f"[AVISO] Word COM falhou: {e}. Tentando fallback headless...")
            # Fallback LibreOffice
            soffice_ret = os.system(f'soffice --headless --convert-to docx "{doc_path}" --outdir "{output_dir}"')
            if soffice_ret == 0 and target_docx.exists():
                return target_docx
            raise RuntimeError(f"Não foi possível converter {doc_path.name} para docx: {e}")

    return doc_path


# ============================================================================
# 2. PARSING DE CÓDIGOS, ESPECIFICAÇÕES E APLICAÇÕES
# ============================================================================

def clean_text(text: str) -> str:
    cleaned = text.replace("\r", " ").replace("\n", " ").replace("\t", " ")
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned

def extract_circuit_specs(text: str) -> Dict[str, Any]:
    """
    Extrai Lado (LD/LE/Ambos), Sistema de Lanterna (Arteb/Cibié) e Aplicação Veicular.
    """
    upper = text.upper()
    
    # 1. Posição / Lado
    position = "LD/LE (Ambos)"
    position_badge = "Ambos (LD/LE)"
    if "CENTRAL" in upper:
        if "DIR" in upper or "DIREIT" in upper:
            position = "Central LD"
            position_badge = "Central LD"
        elif "ESQ" in upper:
            position = "Central LE"
            position_badge = "Central LE"
        else:
            position = "Central"
            position_badge = "Central"
    elif "LE/LD" in upper or "LD/LE" in upper or "DIR/ESQ" in upper or "ESQ/DIR" in upper or "DIREITO/ ESQUERDO" in upper or "DIREITO/ESQUERDO" in upper:
        position = "LD/LE (Ambos)"
        position_badge = "Ambos (LD/LE)"
    elif "DIREIT" in upper or " DIR" in upper or " LD" in upper:
        position = "LD"
        position_badge = "LD (Passageiro)"
    elif "ESQUERD" in upper or " ESQ" in upper or " LE" in upper:
        position = "LE"
        position_badge = "LE (Motorista)"

    # 2. Sistema de Lanterna
    system = None
    if "ARTEB" in upper:
        system = "Arteb"
    elif "CIBIE" in upper or "CIBIÉ" in upper:
        system = "Cibié"
    elif "VDO" in upper:
        system = "VDO"
    elif "MARELLI" in upper:
        system = "Marelli"

    # 3. Montadora
    make = "Outros"
    if any(m in upper for m in ["GOL", "FOX", "FUSCA", "KOMBI", "PARATI", "SAVEIRO", "VOYAGE", "SANTANA", "PASSAT", "VARIANT", "BRASILIA", "VW", "VOLKS"]):
        make = "VW"
    elif any(m in upper for m in ["UNO", "PALIO", "SIENA", "STRADA", "FIORINO", "ELBA", "TEMPRA", "MAREA", "FIAT", "500"]):
        make = "Fiat"
    elif any(m in upper for m in ["CHEVETTE", "KADETT", "CELTA", "CORSA", "OPALA", "MONZA", "IPANEMA", "VECTRA", "ASTRA", "AGILE", "MONTANA", "GM", "CHEVROLET"]):
        make = "GM"
    elif any(m in upper for m in ["ESCORT", "PAMPA", "CORCEL", "ECOSPORT", "FIESTA", "KA", "FORD", "CARGO"]):
        make = "Ford"
    elif "HONDA" in upper or "FIT" in upper or "CIVIC" in upper:
        make = "Honda"
    elif "COROLLA" in upper or "TOYOTA" in upper:
        make = "Toyota"

    # 4. Anos / Geração
    years_match = re.search(r"(\d{2}/\d{2}|\d{2}/\.\.\.|\d{4}/\d{4}|\d{4}/\.\.\.|ATE \d{2}|ATÉ \d{2}|\d{2}\.\.\.|\d{2}/\d{2}/\d{2})", upper)
    years = years_match.group(0) if years_match else None

    return {
        "position": position,
        "positionBadge": position_badge,
        "lanternSystem": system,
        "make": make,
        "years": years,
    }

def extract_socket_specs(text: str) -> Dict[str, Any]:
    """
    Extrai Lâmpada (1 Polo, 2 Polos, H1, H4, H7, T10, T5, etc.), Material, Pinos e Vias.
    """
    upper = text.upper()
    
    # Polos
    poles = None
    if "1POLO" in upper or "1 POLO" in upper or " 1P " in upper or "1P " in upper:
        poles = 1
    elif "2POLO" in upper or "2 POLOS" in upper or "2 POLO" in upper or " 2P " in upper or "2P " in upper:
        poles = 2

    # Tipo de Lâmpada
    lamp_type = None
    if "H7" in upper:
        lamp_type = "H7"
    elif "H4" in upper:
        lamp_type = "H4"
    elif "H1" in upper:
        lamp_type = "H1"
    elif "T10" in upper or "PINGAO" in upper or "PINGÃO" in upper:
        lamp_type = "Pingo T10 (W5W)"
    elif "PINGUINHO" in upper or "T5" in upper or "B8.5" in upper:
        lamp_type = "Pinguinho T5"
    elif "LAMPADA 69" in upper or "LAMP. 69" in upper or "LAMP.69" in upper or "LAMP 69" in upper or "LÂMPADA 69" in upper:
        lamp_type = "Lâmpada 69"
    elif "LAMPADA 75" in upper or "LAMP. 75" in upper or "LAMP.75" in upper:
        lamp_type = "Lâmpada 75"
    elif "PY 21W" in upper or "PY21W" in upper:
        lamp_type = "PY21W (Pisca Âmbar)"
    elif "WSW" in upper or "W5W" in upper:
        lamp_type = "W5W"
    elif "SEALED BEAN" in upper:
        lamp_type = "Sealed Bean"
    elif poles == 1:
        lamp_type = "1 Polo (BA15s)"
    elif poles == 2:
        lamp_type = "2 Polos (BAY15d)"

    # Tipo de Pino
    pin_type = None
    if "PINO DOIDO" in upper or "PINO DESENCONTRADO" in upper or "150" in upper or "PINO Y" in upper or "PINO DOIDO Y" in upper:
        pin_type = "Pino Desencontrado (150° / Pino Doido)"
    elif "PINO RETO" in upper or "180" in upper:
        pin_type = "Pino Reto (180°)"

    # Fios / Vias / Rabicho
    wires = None
    if "RABICHO" in upper:
        wires = "Rabicho Integrado"
    elif "FIO DE 1,5" in upper or "FIO 1,5" in upper:
        wires = "Fio Reforçado 1.5mm"
    elif "GIRA/GIRA" in upper:
        wires = "Sem Fio (Encaixe Gira-Gira)"

    # Material
    material = None
    if "PORCELANA" in upper or "CERAMICA" in upper or "CERÂMICA" in upper:
        material = "Porcelana / Cerâmica"
    elif "LATAO" in upper or "LATÃO" in upper or "METALIZADO" in upper:
        material = "Metal / Latão"
    elif "NYLON" in upper:
        material = "Nylon"

    # Formato / Base
    base_style = None
    if "ARRANHA" in upper:
        base_style = "Arranha / Encaixe de Pressão"
    elif "HASTE EM L" in upper:
        base_style = "Haste em L"
    elif "HASTE RETA" in upper:
        base_style = "Haste Reta"
    elif "BASE OVAL" in upper:
        base_style = "Base Oval"
    elif "SOQ/PERA" in upper or "PERA" in upper:
        base_style = "Pera"
    elif "PAINEL" in upper:
        base_style = "Painel / B8.5d"

    # Montadora
    make = "Universal"
    if any(m in upper for m in ["GOL", "FOX", "FUSCA", "KOMBI", "PARATI", "SAVEIRO", "VOYAGE", "SANTANA", "PASSAT", "VARIANT", "BRASILIA", "VW", "VOLKS", "POLO"]):
        make = "VW"
    elif any(m in upper for m in ["UNO", "PALIO", "SIENA", "STRADA", "FIORINO", "TEMPRA", "MAREA", "FIAT", "500"]):
        make = "Fiat"
    elif any(m in upper for m in ["CHEVETTE", "KADETT", "CELTA", "CORSA", "OPALA", "MONZA", "IPANEMA", "VECTRA", "ASTRA", "AGILE", "MONTANA", "GM", "CHEVROLET"]):
        make = "GM"
    elif any(m in upper for m in ["ESCORT", "PAMPA", "CORCEL", "ECOSPORT", "FIESTA", "KA", "FORD", "CARGO"]):
        make = "Ford"
    elif "HONDA" in upper or "FIT" in upper or "CIVIC" in upper:
        make = "Honda"
    elif "COROLLA" in upper or "TOYOTA" in upper:
        make = "Toyota"

    return {
        "lampType": lamp_type,
        "poles": poles,
        "pinType": pin_type,
        "wires": wires,
        "material": material,
        "baseStyle": base_style,
        "make": make,
    }


def parse_cell_codes(text: str) -> Tuple[str, List[str], List[str]]:
    """
    Identifica o código comercial principal, códigos cruzados (cross-references) e OEM.
    """
    cross_codes: List[str] = []
    oem_codes: List[str] = []
    
    # Procura códigos conhecidos
    # DP-xxxx, DPxxxx, DEPxxxx, ETE-xxxx, ETExxxx, TC-xxxx, TCxxxx, U-xxxx, IM-xxxx, DNIxxxx, CHWxxxxx, LSxxx, OSRAN xxxx, 2721MF, D2452MFX6, etc.
    code_patterns = [
        r"\b(?:DP|DEP)[-–\s]?\d{4}[A-Z]?\b",
        r"\bETE[-–\s]?\d{4}\b",
        r"\bTC[-–\s]?\d{4}\b",
        r"\bCHW\d{5}\b",
        r"\bLS\d{3}\b",
        r"\bD\d{4,5}MFX?\d?\b",
        r"\b\d{4,6}MFX?\d?\b",
        r"\bORS\d{3}\b",
        r"\b\d{5}\b", # e.g. 19810
    ]
    
    found_codes: List[str] = []
    for pat in code_patterns:
        matches = re.findall(pat, text, re.IGNORECASE)
        for m in matches:
            clean_m = re.sub(r"[-–\s]+", "-", m.strip().upper())
            # Ajusta DP e DEP
            if clean_m.startswith("DP") and not clean_m.startswith("DP-") and len(clean_m) > 2 and clean_m[2].isdigit():
                clean_m = f"DP-{clean_m[2:]}"
            elif clean_m.startswith("DEP") and not clean_m.startswith("DEP-") and len(clean_m) > 3 and clean_m[3].isdigit():
                clean_m = f"DEP-{clean_m[3:]}"
            elif clean_m.startswith("ETE") and not clean_m.startswith("ETE-") and len(clean_m) > 3 and clean_m[3].isdigit():
                clean_m = f"ETE-{clean_m[3:]}"
            if clean_m not in found_codes:
                found_codes.append(clean_m)

    # OEM numbers (e.g. 90.047.485, 131.941.117-1)
    oem_matches = re.findall(r"\b\d{2,3}\.\d{3}\.\d{3}(?:-\d)?\b", text)
    for o in oem_matches:
        if o not in oem_codes:
            oem_codes.append(o)

    primary_code = found_codes[0] if found_codes else ""
    if len(found_codes) > 1:
        cross_codes = found_codes[1:]

    return primary_code, cross_codes, oem_codes


def create_search_tokens(
    box_number: str,
    internal_code: Optional[str],
    primary_code: str,
    cross_codes: List[str],
    oem_codes: List[str],
    desc_clean: str,
    specs: Dict[str, Any]
) -> List[str]:
    """
    Gera lista de tokens únicos e normalizados para indexação e busca ultra-rápida.
    """
    tokens = set()
    
    # Caixa
    box_num = box_number.strip().upper()
    tokens.add(box_num)
    tokens.add(f"CX{box_num}")
    tokens.add(f"CX {box_num}")
    tokens.add(f"CAIXA {box_num}")
    if box_num.isdigit():
        tokens.add(str(int(box_num)))
        tokens.add(f"CX{int(box_num)}")
        tokens.add(f"CAIXA{int(box_num)}")

    # Códigos
    for c in [primary_code] + cross_codes:
        if c:
            tokens.add(c.upper())
            tokens.add(re.sub(r"[^A-Z0-9]", "", c.upper()))
            tokens.add(c.lower())
            tokens.add(re.sub(r"[^a-z0-9]", "", c.lower()))

    if internal_code:
        tokens.add(internal_code.upper())
        tokens.add(re.sub(r"[^A-Z0-9]", "", internal_code.upper()))

    for o in oem_codes:
        tokens.add(o.upper())
        tokens.add(re.sub(r"[^A-Z0-9]", "", o.upper()))

    # Palavras da descrição
    words = re.findall(r"[a-zA-Z0-9/]+", desc_clean.lower())
    for w in words:
        if len(w) >= 2:
            tokens.add(w)

    # Especificações
    for k, v in specs.items():
        if isinstance(v, str):
            for part in re.findall(r"[a-zA-Z0-9]+", v.lower()):
                if len(part) >= 2:
                    tokens.add(part)
        elif isinstance(v, int):
            tokens.add(f"{v}polo")
            tokens.add(f"{v}polos")
            tokens.add(f"{v}p")

    return sorted(list(tokens))


# ============================================================================
# 3. EXTRAÇÃO DE IMAGENS DO XML DE CADA CÉLULA
# ============================================================================

def get_image_bytes_from_tc(doc: Any, tc_elem: Any) -> Optional[bytes]:
    """
    Localiza o rId dentro da célula (<w:tc>) em v:imagedata ou a:blip e extrai o blob binário da imagem.
    """
    tc_xml = ET.fromstring(tc_elem.xml)
    
    # 1. v:imagedata r:id="..."
    v_imgs = tc_xml.findall('.//{urn:schemas-microsoft-com:vml}imagedata')
    for v in v_imgs:
        r_id = v.attrib.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id')
        if r_id and r_id in doc.part.rels:
            return doc.part.rels[r_id].target_part.blob

    # 2. a:blip r:embed="..."
    blips = tc_xml.findall('.//{http://schemas.openxmlformats.org/drawingml/2006/main}blip')
    for b in blips:
        r_id = b.attrib.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}embed')
        if r_id and r_id in doc.part.rels:
            return doc.part.rels[r_id].target_part.blob

    return None


# ============================================================================
# 4. PIPELINE PRINCIPAL DE EXTRAÇÃO DOS DOIS DOCUMENTOS
# ============================================================================

def extract_catalogs() -> Dict[str, Any]:
    conv_dir = SCRIPT_DIR / ".converted_docx"
    images_out_dir = PROJECT_ROOT / "public" / "catalog-images" / "soquetes-circuitos"
    images_out_dir.mkdir(parents=True, exist_ok=True)

    doc_files = [
        ("PLACAS DE CIRCUITO.doc", "circuito", "Placas de Circuito de Lanterna"),
        ("SOQUETE DIVERSOS.doc", "soquete", "Soquetes Diversos"),
    ]

    items: List[Dict[str, Any]] = []
    stats = {
        "circuitoItems": 0,
        "soqueteItems": 0,
        "totalImages": 0,
        "pixelAuditPass": 0,
        "pixelAuditFail": 0,
    }

    for doc_name, macro_cat, cat_name in doc_files:
        raw_doc_path = PROJECT_ROOT / doc_name
        if not raw_doc_path.exists():
            print(f"[ERRO] Arquivo não encontrado: {raw_doc_path}")
            continue

        docx_path = convert_doc_to_docx_if_needed(raw_doc_path, conv_dir)
        doc = docx.Document(docx_path)
        print(f"\n[EXTRAÇÃO] Processando {doc_name} ({len(doc.tables)} tabelas)...")

        for t_idx, tbl in enumerate(doc.tables):
            for r_idx, row in enumerate(tbl.rows):
                cells = row.cells
                if len(cells) < 6:
                    continue

                # Slots: Esquerdo (0, 1, 2) e Direito (3, 4, 5)
                slots = [
                    (0, 1, 2, "left"),
                    (3, 4, 5, "right"),
                ]

                for img_c, desc_c, box_c, slot_pos in slots:
                    # Cabeçalho?
                    if r_idx == 0:
                        header_check = (cells[img_c].text + cells[desc_c].text + cells[box_c].text).upper()
                        if "FIGURA" in header_check or "DESCRI" in header_check or "CX" in header_check:
                            continue

                    raw_desc = cells[desc_c].text.strip()
                    raw_box = cells[box_c].text.strip()
                    img_bytes = get_image_bytes_from_tc(doc, cells[img_c]._tc)

                    # Se slot totalmente vazio
                    if not raw_desc and not raw_box and not img_bytes:
                        continue

                    # Extrai boxNumber e internalCode se houver linhas
                    box_lines = [l.strip() for l in raw_box.split("\n") if l.strip()]
                    box_number = box_lines[0] if box_lines else ""
                    # Remove "CX" ou "CX."
                    box_number = re.sub(r"^(?:CX\.?|CAIXA)\s*", "", box_number, flags=re.IGNORECASE).strip()
                    internal_code = box_lines[1] if len(box_lines) > 1 else None

                    # Higieniza descrição
                    desc_clean = clean_text(raw_desc)

                    # Parsing de códigos
                    primary_code, cross_codes, oem_codes = parse_cell_codes(desc_clean)

                    # Golden Rule: Preservar itens sem código ou sem descrição
                    needs_desc_review = False
                    if not desc_clean:
                        needs_desc_review = True
                        desc_clean = f"[Identificação Visual] {cat_name} — Caixa {box_number}"

                    # Gera ID único em lowercase
                    prefix = "pc" if macro_cat == "circuito" else "sq"
                    box_slug = re.sub(r"[^a-z0-9]+", "", box_number.lower()) or f"r{r_idx}{slot_pos[0]}"
                    code_slug = re.sub(r"[^a-z0-9]+", "-", (primary_code or "").lower()).strip("-")
                    
                    if code_slug:
                        item_id = f"{prefix}-cx{box_slug}-{code_slug}"
                    else:
                        clean_title_slug = re.sub(r"[^a-z0-9]+", "-", desc_clean[:25].lower()).strip("-")
                        item_id = f"{prefix}-cx{box_slug}-{clean_title_slug}"

                    # Garante unicidade do item_id
                    existing_ids = {it["id"] for it in items}
                    if item_id in existing_ids:
                        item_id = f"{item_id}-{slot_pos[0]}"

                    # Imagem Studio WebP
                    image_filename = f"{item_id}.webp"
                    image_path = images_out_dir / image_filename
                    primary_image_rel = f"/catalog-images/soquetes-circuitos/{image_filename}"

                    if img_bytes:
                        res = convert_bytes_to_studio_webp(
                            raw_image_bytes=img_bytes,
                            output_path=image_path,
                            clean_corners=True,
                            padding=16,
                            quality=96,
                        )
                        stats["totalImages"] += 1
                        if res.audit_passed:
                            stats["pixelAuditPass"] += 1
                        else:
                            stats["pixelAuditFail"] += 1
                            print(f"[!] Falha na auditoria de pixel ({item_id}): {res.audit_message}")
                    else:
                        print(f"[AVISO] Item sem imagem no Word: {item_id}")

                    # Especificações por Macro-Categoria
                    if macro_cat == "circuito":
                        circuit_specs = extract_circuit_specs(desc_clean)
                        socket_specs = None
                        sub_category = f"Lanterna Traseira ({circuit_specs['position']})"
                        stats["circuitoItems"] += 1
                        all_specs = circuit_specs
                    else:
                        circuit_specs = None
                        socket_specs = extract_socket_specs(desc_clean)
                        if socket_specs["lampType"] and "H" in socket_specs["lampType"]:
                            sub_category = "Farol e Milha"
                        elif socket_specs["baseStyle"] == "Painel / B8.5d" or "PAINEL" in desc_clean.upper():
                            sub_category = "Painel e Instrumentos"
                        elif "PISCA" in desc_clean.upper() or "SETA" in desc_clean.upper():
                            sub_category = "Lanterna e Pisca"
                        elif "PLACA" in desc_clean.upper():
                            sub_category = "Luz de Placa"
                        else:
                            sub_category = "Soquetes Universais e Diversos"
                        stats["soqueteItems"] += 1
                        all_specs = socket_specs

                    # Search tokens
                    search_tokens = create_search_tokens(
                        box_number=box_number,
                        internal_code=internal_code,
                        primary_code=primary_code,
                        cross_codes=cross_codes,
                        oem_codes=oem_codes,
                        desc_clean=desc_clean,
                        specs=all_specs,
                    )

                    # Monta objeto final
                    item = {
                        "id": item_id,
                        "boxNumber": box_number,
                        "internalCode": internal_code,
                        "commercialCodeRaw": primary_code or (f"SQ-{box_number}" if macro_cat == "soquete" else f"PC-{box_number}"),
                        "normalizedCode": re.sub(r"[^a-z0-9]", "", (primary_code or "").lower()),
                        "crossReferenceCodes": cross_codes,
                        "oemCodes": oem_codes,
                        "title": desc_clean.split(". ")[0].split("\n")[0][:80],
                        "descriptionRaw": desc_clean,
                        "category": cat_name,
                        "macroCategory": macro_cat,
                        "subCategory": sub_category,
                        "circuitSpecs": circuit_specs,
                        "socketSpecs": socket_specs,
                        "primaryImage": primary_image_rel,
                        "additionalImages": [],
                        "sourceDocument": doc_name,
                        "rowIndex": r_idx,
                        "slot": slot_pos,
                        "needsDescriptionReview": needs_desc_review,
                        "searchTokens": search_tokens,
                        "price": None,
                        "notes": "",
                    }
                    items.append(item)

    # Gravação do seed master
    data_dir = PROJECT_ROOT / "src" / "data"
    data_dir.mkdir(parents=True, exist_ok=True)
    master_seed_path = data_dir / "catalog-master-seed.json"

    seed_payload = {
        "metadata": {
            "version": "1.0.0",
            "extractedAt": "2026-10-30",
            "totalItems": len(items),
            "circuitoCount": stats["circuitoItems"],
            "soqueteCount": stats["soqueteItems"],
            "totalImages": stats["totalImages"],
            "pixelAuditPass": stats["pixelAuditPass"],
            "sourceDocuments": [
                {
                    "fileName": "PLACAS DE CIRCUITO.doc",
                    "description": "Placas de Circuito de Lanterna Traseira e Pisca",
                    "itemCount": stats["circuitoItems"],
                },
                {
                    "fileName": "SOQUETE DIVERSOS.doc",
                    "description": "Soquetes de Farol, Lanterna, Pisca, Painel e Rabichos",
                    "itemCount": stats["soqueteItems"],
                }
            ],
        },
        "items": items,
    }

    with open(master_seed_path, "w", encoding="utf-8") as f:
        json.dump(seed_payload, f, ensure_ascii=False, indent=2)

    print("\n" + "=" * 60)
    print("RESUMO DA EXTRAÇÃO OFICIAL (PADRÃO OURO)")
    print("=" * 60)
    print(f"Total de Itens Extraídos: {len(items)}")
    print(f"  - Placas de Circuito: {stats['circuitoItems']}")
    print(f"  - Soquetes Diversos : {stats['soqueteItems']}")
    print(f"Total de Imagens Convertidas para WebP: {stats['totalImages']}")
    print(f"Auditoria de Pixels #FFFFFF (Pass): {stats['pixelAuditPass']}")
    print(f"Auditoria de Pixels (Fail): {stats['pixelAuditFail']}")
    print(f"Arquivo Master Seed Salvo: {master_seed_path} ({master_seed_path.stat().st_size} bytes)")
    print("=" * 60)

    return seed_payload

if __name__ == "__main__":
    extract_catalogs()
