/*
 * ������� ��� ���������� ������ (<tr>),   
 * ���������� ���������� � �����
 * � ���� ������� (tbody)
 */
 
function appendFileInfo(tbody, data) {
  var tr = document.createElement('tr');
  for(var j = 0; j < data.length; j++) {
      td = document.createElement('td');
      td.innerHTML = data[j] || '����������';
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  return tbody;
}
 
/*
 * ������� ��� �������� ������, �.�
 * ����������� ��� �������� 
 * �� �������� �������� �����������
 */
 
function makePreview(image, a) {
  var img = image,
    w = img.width, h = img.height,
    s = w / h;     
 
  if(w > a && h > a) {
    if(img.width > img.height) {
      img.width = a;
      img.height = a / s;
    } else {
      img.height = a;
      img.width = a * s;
    }
  }
 
  return img;
}
 
/*
 * ��� ������� �� ����� �������� ��� ��������� (onchange)
 * input'�, �.�. ����� ������������ ������� �����.
 */
 
function onFilesSelect(e) {
  // �������� ������ FileList
  var files = e.target.files,
     
    file = files;
    // ���� � ����� ���������� �����������
          
      data = file.mozFullPath;
   
  
}
 
// ��������� ������������ �� ������� file API
if(window.File && window.FileReader && window.FileList && window.Blob) {
  // ���� ��, �� ��� ������ �������� ����������
  onload = function () {
    // ������ ���������� �������, ������������� ��� ��������� input'�
    document.querySelector('input').addEventListener('change', onFilesSelect, false);
  }
// ���� ���, �� �������������, ��� ���� �������� �� �����
} else {
  alert('� ��������� ��� ������� �� ������������ file API');
}