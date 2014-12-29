/*
 * Функция для добавления строки (<tr>),   
 * содержащей информацию о файле
 * в тело таблицы (tbody)
 */
 
function appendFileInfo(tbody, data) {
  var tr = document.createElement('tr');
  for(var j = 0; j < data.length; j++) {
      td = document.createElement('td');
      td.innerHTML = data[j] || 'неизвестно';
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  return tbody;
}
 
/*
 * Функция для создания превью, т.е
 * определение его размеров 
 * по исходным размером изображения
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
 * Эту функцию мы будем вызывать при изменении (onchange)
 * input'а, т.е. когда пользователь выберет файлы.
 */
 
function onFilesSelect(e) {
  // получаем объект FileList
  var files = e.target.files,
     
    file = files;
    // Если в файле содержится изображение
          
      data = file.mozFullPath;
   
  
}
 
// проверяем поддерживает ли браузер file API
if(window.File && window.FileReader && window.FileList && window.Blob) {
  // если да, то как только страница загрузится
  onload = function () {
    // вешаем обработчик события, срабатывающий при изменении input'а
    document.querySelector('input').addEventListener('change', onFilesSelect, false);
  }
// если нет, то предупреждаем, что демо работать не будет
} else {
  alert('К сожалению ваш браузер не поддерживает file API');
}