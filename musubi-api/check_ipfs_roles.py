#!/usr/bin/env python3
"""
Script para verificar roles en el contrato IPFSRegistry
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from web3 import Web3
from config.contracts import get_web3_instance, get_contract_address, get_contract_abi

def check_ipfs_roles():
    """Verifica los roles en el contrato IPFSRegistry"""
    try:
        # Obtener instancia de Web3
        w3 = get_web3_instance('local')
        
        # Obtener dirección y ABI del contrato IPFSRegistry
        contract_address = get_contract_address('IPFSRegistry')
        contract_abi = get_contract_abi('IPFSRegistry')
        
        if not contract_address or not contract_abi:
            print("❌ No se pudo obtener la dirección o ABI del contrato IPFSRegistry")
            return
        
        print(f"🔍 Verificando roles en IPFSRegistry: {contract_address}")
        
        # Crear instancia del contrato
        contract = w3.eth.contract(address=contract_address, abi=contract_abi)
        
        # Obtener la cuenta del backend (cuenta 1 de Hardhat)
        backend_account = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
        
        # Verificar roles
        admin_role = contract.functions.ADMIN_ROLE().call()
        writer_role = contract.functions.WRITER_ROLE().call()
        reader_role = contract.functions.READER_ROLE().call()
        
        print(f"📋 Roles disponibles:")
        print(f"   ADMIN_ROLE: {admin_role}")
        print(f"   WRITER_ROLE: {writer_role}")
        print(f"   READER_ROLE: {reader_role}")
        
        # Verificar si el backend tiene los roles
        has_admin = contract.functions.hasRole(admin_role, backend_account).call()
        has_writer = contract.functions.hasRole(writer_role, backend_account).call()
        has_reader = contract.functions.hasRole(reader_role, backend_account).call()
        
        print(f"\n🔑 Roles de la cuenta {backend_account}:")
        print(f"   ADMIN_ROLE: {'✅' if has_admin else '❌'}")
        print(f"   WRITER_ROLE: {'✅' if has_writer else '❌'}")
        print(f"   READER_ROLE: {'✅' if has_reader else '❌'}")
        
        if not has_writer:
            print("\n⚠️  PROBLEMA: El backend no tiene WRITER_ROLE")
            print("   Esto significa que no puede registrar hashes en IPFSRegistry")
            print("   Solución: Otorgar WRITER_ROLE al backend")
        else:
            print("\n✅ El backend tiene WRITER_ROLE - puede registrar hashes")
        
        # Verificar si hay algún hash registrado
        total_records = contract.functions.getTotalRecords().call()
        print(f"\n📊 Total de registros en IPFSRegistry: {total_records}")
        
        if total_records > 0:
            print("   Mostrando registros existentes:")
            for i in range(1, min(total_records + 1, 6)):  # Mostrar máximo 5
                try:
                    record = contract.functions.getRecord(i).call()
                    print(f"   Record {i}: {record[0]} (collection: {record[2]})")
                except Exception as e:
                    print(f"   Record {i}: Error - {e}")
        
    except Exception as e:
        print(f"❌ Error verificando roles: {e}")

if __name__ == "__main__":
    check_ipfs_roles() 