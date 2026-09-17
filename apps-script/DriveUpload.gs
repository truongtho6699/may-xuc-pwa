const CONFIG = {
  DRIVE_FOLDER_ID: '1k7GwdI63ABzziT0KuK7Wx3ZRUXmZL6g5',
  SUPABASE_API_URL: 'https://dnqhikwqihfxvezqzqzn.supabase.co/functions/v1/nghi-son-api'
};

function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const token = String(body.token || '');
    if (!token) return json_({ success: false, message: 'Thiếu phiên đăng nhập.' });

    const authRes = UrlFetchApp.fetch(CONFIG.SUPABASE_API_URL + '?action=upload/authorize', {
      method: 'post',
      contentType: 'application/json',
      muteHttpExceptions: true,
      payload: JSON.stringify({ token: token })
    });
    const authJson = JSON.parse(authRes.getContentText() || '{}');
    if (!authJson.success || !authJson.data || !authJson.data.allowed) {
      return json_({ success: false, message: 'Phiên đăng nhập không hợp lệ.' });
    }

    const base64 = String(body.base64 || '').replace(/^data:image\/\w+;base64,/, '');
    if (!base64) return json_({ success: false, message: 'Không có dữ liệu ảnh.' });

    const root = DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID);
    const d = new Date();
    const y = String(d.getFullYear());
    const m = ('0' + (d.getMonth() + 1)).slice(-2);
    const day = ('0' + d.getDate()).slice(-2);
    const entityType = safeName_(body.entityType || 'khac');
    const entityId = safeName_(body.entityId || body.clientFileId || Utilities.getUuid());
    const label = safeName_(body.label || 'anh');

    const folder = getOrCreate_(getOrCreate_(getOrCreate_(root, y), m), day);
    const entityFolder = getOrCreate_(folder, entityType);
    const fileName = `${entityId}-${Date.now()}-${label}.jpg`;
    const blob = Utilities.newBlob(Utilities.base64Decode(base64), 'image/jpeg', fileName);
    const file = entityFolder.createFile(blob);

    return json_({
      success: true,
      data: {
        fileId: file.getId(),
        url: file.getUrl(),
        fileName: file.getName(),
        mimeType: 'image/jpeg',
        fileSize: blob.getBytes().length,
        folderId: entityFolder.getId(),
        clientFileId: String(body.clientFileId || ''),
        label: String(body.label || 'anh')
      }
    });
  } catch (err) {
    return json_({ success: false, message: err && err.message ? err.message : 'Không tải được ảnh lên Drive.' });
  }
}

function getOrCreate_(parent, name) {
  const it = parent.getFoldersByName(name);
  return it.hasNext() ? it.next() : parent.createFolder(name);
}

function safeName_(value) {
  return String(value || '').replace(/[\\/:*?"<>|#%{}]/g, '-').replace(/\s+/g, '-').slice(0, 80) || 'khac';
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
