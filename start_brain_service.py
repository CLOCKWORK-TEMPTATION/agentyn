#!/usr/bin/env python3
"""
سكريبت تشغيل خدمة Python المتقدمة
Advanced Python Brain Service Launcher
"""

import os
import sys
import subprocess
import logging
from pathlib import Path

# إعداد التسجيل
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def check_requirements():
    """التحقق من المتطلبات الأساسية"""
    logger.info("التحقق من المتطلبات الأساسية...")
    
    # التحقق من Python version
    if sys.version_info < (3, 8):
        logger.error("يتطلب Python 3.8 أو أحدث")
        return False
    
    # التحقق من وجود ملف requirements.txt
    if not Path("requirements.txt").exists():
        logger.error("ملف requirements.txt غير موجود")
        return False
    
    # التحقق من وجود البيئة الافتراضية
    venv_path = Path("venv")
    if not venv_path.exists():
        logger.warning("البيئة الافتراضية غير موجودة، سيتم إنشاؤها...")
        return create_virtual_environment()
    
    return True

def create_virtual_environment():
    """إنشاء البيئة الافتراضية"""
    try:
        logger.info("إنشاء البيئة الافتراضية...")
        subprocess.run([sys.executable, "-m", "venv", "venv"], check=True)
        
        # تفعيل البيئة وتثبيت المتطلبات
        if os.name == 'nt':  # Windows
            pip_path = Path("venv/Scripts/pip.exe")
        else:  # Unix/Linux/Mac
            pip_path = Path("venv/bin/pip")
        
        logger.info("تثبيت المتطلبات...")
        subprocess.run([str(pip_path), "install", "-r", "requirements.txt"], check=True)
        
        return True
        
    except subprocess.CalledProcessError as e:
        logger.error(f"فشل في إنشاء البيئة الافتراضية: {e}")
        return False

def install_requirements():
    """تثبيت المتطلبات"""
    try:
        logger.info("تثبيت/تحديث المتطلبات...")
        
        if os.name == 'nt':  # Windows
            pip_path = Path("venv/Scripts/pip.exe")
        else:  # Unix/Linux/Mac
            pip_path = Path("venv/bin/pip")
        
        subprocess.run([str(pip_path), "install", "-r", "requirements.txt"], check=True)
        return True
        
    except subprocess.CalledProcessError as e:
        logger.error(f"فشل في تثبيت المتطلبات: {e}")
        return False

def start_service(host="0.0.0.0", port=8000, reload=True):
    """تشغيل الخدمة"""
    try:
        logger.info(f"تشغيل خدمة Python المتقدمة على {host}:{port}")
        
        if os.name == 'nt':  # Windows
            python_path = Path("venv/Scripts/python.exe")
        else:  # Unix/Linux/Mac
            python_path = Path("venv/bin/python")
        
        # التحقق من وجود ملف الخدمة
        service_file = Path("advanced_python_brain_service.py")
        if not service_file.exists():
            logger.error("ملف الخدمة advanced_python_brain_service.py غير موجود")
            return False
        
        # تشغيل الخدمة
        cmd = [
            str(python_path), "-m", "uvicorn",
            "advanced_python_brain_service:app",
            "--host", host,
            "--port", str(port)
        ]
        
        if reload:
            cmd.append("--reload")
        
        logger.info("الخدمة جاهزة للاستخدام!")
        logger.info(f"الوصول للخدمة: http://{host}:{port}")
        logger.info(f"وثائق API: http://{host}:{port}/docs")
        
        subprocess.run(cmd, check=True)
        
    except subprocess.CalledProcessError as e:
        logger.error(f"فشل في تشغيل الخدمة: {e}")
        return False
    except KeyboardInterrupt:
        logger.info("تم إيقاف الخدمة بواسطة المستخدم")
        return True

def main():
    """الدالة الرئيسية"""
    logger.info("=== بدء تشغيل خدمة Python المتقدمة ===")
    
    # التحقق من المتطلبات
    if not check_requirements():
        logger.error("فشل في التحقق من المتطلبات")
        sys.exit(1)
    
    # تثبيت المتطلبات
    if not install_requirements():
        logger.error("فشل في تثبيت المتطلبات")
        sys.exit(1)
    
    # قراءة المتغيرات من سطر الأوامر
    import argparse
    parser = argparse.ArgumentParser(description="تشغيل خدمة Python المتقدمة")
    parser.add_argument("--host", default="0.0.0.0", help="عنوان الخادم")
    parser.add_argument("--port", type=int, default=8000, help="منفذ الخادم")
    parser.add_argument("--no-reload", action="store_true", help="تعطيل إعادة التحميل التلقائي")
    
    args = parser.parse_args()
    
    # تشغيل الخدمة
    success = start_service(
        host=args.host,
        port=args.port,
        reload=not args.no_reload
    )
    
    if not success:
        sys.exit(1)

if __name__ == "__main__":
    main()