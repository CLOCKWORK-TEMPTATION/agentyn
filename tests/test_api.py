import os
import time
import pytest
from fastapi.testclient import TestClient
from advanced_python_brain_service import app

client = TestClient(app)

@pytest.fixture
def sample_script():
    content = """
    مشهد 1 داخلي نهار غرفة الجلوس
    يدخل أحمد.

    مشهد 2 خارجي ليل الحديقة
    تخرج سارة.
    """
    filename = "test_script.txt"
    with open(filename, "w", encoding="utf-8") as f:
        f.write(content)
    yield filename
    if os.path.exists(filename):
        os.remove(filename)

def test_home_page():
    response = client.get("/")
    assert response.status_code == 200
    assert "نظام تحليل السيناريو الثوري" in response.text

def test_upload_and_process(sample_script):
    # Upload
    with open(sample_script, "rb") as f:
        response = client.post(
            "/api/upload",
            files={"file": ("test_script.txt", f, "text/plain")},
            data={"wardrobe_inference": "true", "legal_alerts": "false"}
        )

    assert response.status_code == 200
    data = response.json()
    assert "job_id" in data
    job_id = data["job_id"]
    assert data["status"] == "pending"

    # Poll status
    # Wait loop
    max_retries = 10
    for _ in range(max_retries):
        response = client.get(f"/api/status/{job_id}")
        assert response.status_code == 200
        status_data = response.json()
        if status_data["status"] in ["completed", "failed"]:
            break
        time.sleep(1)

    assert status_data["status"] == "completed"
    assert status_data["progress"] == 100
    assert status_data["result_url"] is not None

    # Download Report
    report_url = status_data["result_url"]
    response = client.get(report_url)
    assert response.status_code == 200
    assert "text/html" in response.headers["content-type"]
    # Check for encoded or decoded text match. The file is utf-8.
    # The output HTML will contain the scene summary or text.
    # Note: The breakdown system might normalize text or escape it.
    assert "مشهد 1" in response.text

def test_invalid_job_id():
    response = client.get("/api/status/invalid-id")
    assert response.status_code == 404

def test_report_not_found_for_invalid_id():
    response = client.get("/api/report/invalid-id")
    assert response.status_code == 404
