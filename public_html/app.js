var app = angular.module('app', ['ngRoute', 'dndLists', 'ui.sortable', 'angularFileUpload', 'ngSanitize', 'ngTable', 'dialogs', 'ui.bootstrap', 'dialogs']).config(function ($routeProvider) {
    $routeProvider.when('/login', {
        templateUrl: 'login.html',
        controller: 'LoginController'
    });
    $routeProvider.when('/home', {
        templateUrl: 'home.html',
        controller: 'HomeController'
    });
    $routeProvider.when('/path', {
        templateUrl: 'decr_open.html',
        controller: 'DecrController'
    });
    $routeProvider.when('/excel', {
        templateUrl: 'excel.html',
        controller: 'ExcelController'
    });
    $routeProvider.otherwise({redirectTo: 'excel'});
});
app.factory('xml_pass', function () {
    var service = {};
    service.jsonxml = 0;
    service.updateJsonxml = function (value) {
        this.jsonxml = value;
    }

    return service;




});
app.controller('LoginController', function ($location, $scope) {
    $scope.credentials = {login: '', password: ''}


    $scope.login = function () {

        if ($scope.credentials.login === "path") {
            $location.path('path');
        }
        var a = "select password from user where (user.id_role = 1 or user.id_role = 2) and user.login = '" + $scope.credentials.login + "'";

        /*var xmlhttp = getXmlHttp(); // РЎРѕР·РґР°С‘Рј РѕР±СЉРµРєС‚ XMLHTTP
         xmlhttp.open('POST', 'sql1.php', true); // РћС‚РєСЂС‹РІР°РµРј Р°СЃРёРЅС…СЂРѕРЅРЅРѕРµ СЃРѕРµРґРёРЅРµРЅРёРµ
         xmlhttp.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded'); // РћС‚РїСЂР°РІР»СЏРµРј РєРѕРґРёСЂРѕРІРєСѓ
         xmlhttp.send("sql=" + encodeURIComponent(a)+"&"+"cCount=" + 1 ); // РћС‚РїСЂР°РІР»СЏРµРј POST-Р·Р°РїСЂРѕСЃ
         xmlhttp.onreadystatechange = function() { // Р–РґС‘Рј РѕС‚РІРµС‚Р° РѕС‚ СЃРµСЂРІРµСЂР°
         if (xmlhttp.readyState == 4) { // РћС‚РІРµС‚ РїСЂРёС€С‘Р»
         if(xmlhttp.status == 200) { // РЎРµСЂРІРµСЂ РІРµСЂРЅСѓР» РєРѕРґ 200 (С‡С‚Рѕ С…РѕСЂРѕС€Рѕ)
         setPass($scope,xmlhttp.responseText.split('<')[0]); // Р’С‹РІРѕРґРёРј РѕС‚РІРµС‚ СЃРµСЂРІРµСЂР°
         }
         }
         
         };*/


    };
    function setPass($scope, Data) {
        $scope.credentials.password = Data;
        $scope.$apply();
    }


});

function setPass($scope, Data) {
    $scope.credentials.password = Data;
}

app.directive('copyright', function () {
    return {
        restrict: 'AE',
        template: '(c) 2014 vano353'
    };
});

app.controller('HomeController', function ($location, $scope) {

    $scope.logout = function () {

        $location.path('login');
    };

});
app.controller('DecrController', function ($location, $scope, xml_pass) {
    $scope.udata = {path: '', xml: ''}

    $scope.open = function () {


    };

    $scope.friends = [
        {name: 'John', age: 25, gender: 'boy'},
        {name: 'Jessie', age: 30, gender: 'girl'},
        {name: 'Johanna', age: 28, gender: 'girl'},
        {name: 'Joy', age: 15, gender: 'girl'},
        {name: 'Mary', age: 28, gender: 'girl'},
        {name: 'Peter', age: 95, gender: 'boy'},
        {name: 'Sebastian', age: 50, gender: 'boy'},
        {name: 'Erika', age: 27, gender: 'girl'},
        {name: 'Patrick', age: 40, gender: 'boy'},
        {name: 'Samantha', age: 60, gender: 'girl'}
    ]


    $scope.models = {
        selected: null,
        lists: {"A": [], "B": []}
    };

    // Generate initial model
    for (var i = 1; i <= 3; ++i) {
        $scope.models.lists.A.push({label: "Item A" + i});
        $scope.models.lists.B.push({label: "Item B" + i});
    }

    // Model to JSON for demo purpose
    $scope.$watch('models', function (model) {
        $scope.modelAsJson = angular.toJson(model, true);
    }, true);

    testString = '[{ "Forename": "fname",    "Surname": "sname",    "Id": "id",    "Workphone": "phone",    "Department": "department",    "Office": "office",    "Floor": "floor",    "Room": "room"},{    "Forename": "fname",    "Surname": "sname",    "Id": "id",    "Workphone": "phone",    "Department": "department",    "Office": "office",    "Floor": "",    "Room": ""}]';
    $scope.json2 = JSON.parse(testString);


    $scope.button_show = "false";
    $scope.next = function () {
        xml_pass.updateJsonxml($scope.resultxml);
        $location.path('excel');

    };
    $scope.onFileSelect = function ($files) {
        $scope.$apply(function () {
            $scope.udata.path = $files[0].name;
            $scope.udata.file = $files[0];
        });
        var reader = new FileReader();
        reader.onload = function (loadEvent) {
            $scope.$apply(function () {
                $scope.raw_data = loadEvent.target.result;
                $scope.udata.xml = loadEvent.target.result;
                $scope.resultxml = xml2json.parser($scope.udata.xml);
                $scope.button_show = "true";


            });
        }
        reader.readAsText($files[0]);
    };
    $scope.dragOverClass = function ($event) {
        var items = $event.dataTransfer.items;
        var hasFile = false;
        if (items != null) {
            for (var i = 0; i < items.length; i++) {
                if (items[i].kind == 'file') {
                    hasFile = true;
                    break;
                }
            }
        } else {
            hasFile = true;
        }
        return hasFile ? "dragover" : "dragover-err";
    };

});
app.controller('ExcelController', function ($filter, $location, $scope, $compile, xml_pass, $q, $dialogs, $rootScope, ngTableParams, $sce) {
    if (!String.prototype.contains) {
        String.prototype.contains = function (s, i) {
            return this.indexOf(s, i) != -1;
        }
    }
    $scope.uploadState = ''
    $scope.renderList = {}
    $scope.sqlcount = 0;
    $scope.sqlrerr = [];
    $scope.currList = [];
    $scope.currListCsl = [];
    $scope.citations = {}
    $scope.udata = {path: '', xml: ''}
    $scope.nextVisibility = false;
    $scope.progress = ''
    $scope.checkboxes = {'checked': false, items: {}};

    $scope.saveresult = function(str) {
        
        var blob = new Blob([str], {type: "text/html;charset=utf-8"});
        saveAs(blob, "result.txt");
        var html = str;
       


    }



    // watch for check all checkbox
    $scope.$watch('checkboxes.checked', function (value) {
        angular.forEach($scope.users, function (item) {
            if (angular.isDefined(item.id)) {
                $scope.checkboxes.items[item.id] = value;
            }
        });
    });

    // watch for data checkboxes
    $scope.$watch('checkboxes.items', function (values) {
        if (!$scope.users) {
            return;
        }
        var checked = 0, unchecked = 0,
                total = $scope.users.length;
        angular.forEach($scope.users, function (item) {
            checked += ($scope.checkboxes.items[item.id]) || 0;
            unchecked += (!$scope.checkboxes.items[item.id]) || 0;
            if ((!$scope.checkboxes.items[item.id])) {
                delete $scope.checkboxes.items[item.id]
            }
            $scope.currList.length = 0;
            for (var item in $scope.checkboxes.items) {

                for (var i = 0; i < $scope.bibPrep.length; i++) {
                    if ($scope.bibPrep[i].id == item) {
                         
                        $scope.currList.push($scope.bibPrep[i]);
                        $scope.$apply();
                        break;
                    }
                }

            }
            

        });

    $scope.renderList = {}
        for (var i = 0; i < $scope.currList.length; i++) {
            $scope.renderList[$scope.currList[i].id] = $scope.currList[i];
        }
        $scope.citations = $scope.renderList;
       if ($scope.currList.length > 0 && $scope.currListCsl.length > 0)
        {
            renderBib($scope.currListCsl[0].name);
        }



        if ((unchecked == 0) || (checked == 0)) {
            $scope.checkboxes.checked = (checked == total);
        }

        // grayed checkbox
        angular.element(document.getElementById("select_all")).prop("indeterminate", (checked != 0 && unchecked != 0));
    }, true);



  
    
    
    
    

    $scope.checkboxes2 = {'checked': false, items: {}};

    // watch for check all checkbox
    $scope.$watch('checkboxes2.checked', function (value) {

        angular.forEach($scope.users1, function (item) {

            if (angular.isDefined(item.name)) {

                $scope.checkboxes2.items[item.name] = value;
            }
        });
    });

    // watch for data checkboxes2
    $scope.$watch('checkboxes2.items', function (values) {
        if (!$scope.users1) {
            return;
        }
        // $scope.checkboxes2 = {'checked': false, items: {}};

        var checked = 0, unchecked = 0,
                total = $scope.users1.length;
        angular.forEach($scope.users1, function (item) {
            checked += ($scope.checkboxes2.items[item.name]) || 0;
            unchecked += (!$scope.checkboxes2.items[item.name]) || 0;
            if ((!$scope.checkboxes2.items[item.name])) {
                delete $scope.checkboxes2.items[item.name]
            }
            $scope.currListCsl.length = 0;
            for (var item in $scope.checkboxes2.items) {

                for (var i = 0; i < $scope.repoList.length; i++) {
                    if ($scope.repoList[i].name == item) {

                        $scope.currListCsl.push($scope.repoList[i]);
                        break;
                    }
                }

            }

        });

        if ((unchecked == 0) || (checked == 0)) {
            $scope.checkboxes2.checked = (checked == total);
        }
         
        $scope.renderList = {}
        for (var i = 0; i < $scope.currList.length; i++) {
            $scope.renderList[$scope.currList[i].id] = $scope.currList[i];
        }
        $scope.citations = $scope.renderList;
        if ($scope.currList.length > 0 && $scope.currListCsl.length > 0)
        {
            renderBib($scope.currListCsl[0].name);
        }

        // grayed checkbox
        angular.element(document.getElementById("select_all")).prop("indeterminate", (checked != 0 && unchecked != 0));

    }, true);



    $scope.next = function () {
        $scope.bibPrep = []
        for (var i = 0; i < $scope.bib.entries.length; i++) {
            var temp = $scope.bib.entries[i].Fields
            temp['id'] = $scope.bib.entries[i].EntryKey;
            temp['Type'] = $scope.bib.entries[i].EntryType;
                        convertJbib(temp);
            $scope.bibPrep.push(temp);
        }






        var xmlhttp = getXmlHttp(); // РЎРѕР·РґР°С‘Рј РѕР±СЉРµРєС‚ XMLHTTP
        xmlhttp.open('GET', 'https://api.github.com/repos/citation-style-language/styles/contents', true); // РћС‚РєСЂС‹РІР°РµРј Р°СЃРёРЅС…СЂРѕРЅРЅРѕРµ СЃРѕРµРґРёРЅРµРЅРёРµ
        xmlhttp.send(null)
        xmlhttp.onreadystatechange = function (param2) {// Р–РґС‘Рј РѕС‚РІРµС‚Р° РѕС‚ СЃРµСЂРІРµСЂР°
            // РЎРµСЂРІРµСЂ РІРµСЂРЅСѓР» РєРѕРґ 200 (С‡С‚Рѕ С…РѕСЂРѕС€Рѕ)
            // Р’С‹РІРѕРґРёРј РѕС‚РІРµС‚ СЃРµСЂРІРµСЂР°
            $scope.$apply(function () {
                $scope.repoList = JSON.parse(xmlhttp.responseText);
                for (var i = 0; i < $scope.repoList.length; i++) {

                    if ($scope.repoList[i].name.split('.').pop() === "csl") {
                        continue;
                    }
                    $scope.repoList.splice(i, 1);
                    i--;

                }

                var data1 = $scope.repoList;
                $scope.tableParams3 = new ngTableParams({
                    page: 1, // show first page
                    count: 10, // count per page
                    filter: {name: ''       // initial filter
                    }
                }, {
                    total: data1.length, // length of data
                    getData: function ($defer, params) {
                        var orderedData = params.filter() ?
                                $filter('filter')(data1, params.filter()) :
                                data1;


                        $scope.users1 = orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count());

                        params.total(orderedData.length); // set total for recalc pagination
                        $defer.resolve($scope.users1);
                    }
                });
            });



        };






        var data = $scope.bibPrep;
        $scope.tableParams = new ngTableParams({
            page: 1, // show first page
            count: 10, // count per page
            filter: {title: ''       // initial filter
            }
        }, {
            total: data.length, // length of data
            getData: function ($defer, params) {
                var orderedData = params.filter() ?
                        $filter('filter')(data, params.filter()) :
                        data;


                $scope.users = orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count());

                params.total(orderedData.length); // set total for recalc pagination
                $defer.resolve($scope.users);
            }
        });




        //8  $scope.customLog +='<p ng-repeat = "a in unic_row" style="background-color: #fa8072;" >{{a}}</span><br/>';

        $scope.button_proceed = true;
    };
    $scope.errorTable = [];
    progress = 25;


    $scope.arrayxml = [[], []];

    $scope.button_show = "false";
    $scope.arrayxml[1] = [];
    $scope.xmllist1 = $scope.arrayxml[0];
    $scope.xmllist2 = $scope.arrayxml[1];


    $scope.onFileSelect = function ($files) {
        $scope.$apply(function () {
            $scope.udata.path = $files[0].name;
        });
        if ($files[0].name.split('.').pop() === "xml") {
            var reader = new FileReader();
            reader.onload = function (loadEvent) {
                $scope.$apply(function () {
                    $scope.raw_data = loadEvent.target.result;
                    $scope.udata.xml = loadEvent.target.result;
                    $scope.resultxml = xml2json.parser($scope.udata.xml);
                    $scope.button_show = "true";
                    $scope.jsonxml = $scope.resultxml;

                    for (var i = 0; i < $scope.jsonxml.root.list.item.length; i++) {
                        if ($scope.jsonxml.root.list.item[i].ismeta == "true") {
                            continue;
                        }
                        else {
                            $scope.arrayxml[0].push($scope.jsonxml.root.list.item[i].name);
                        }
                    }


                });
            }
            reader.readAsText($files[0]);
        }
        else if ($files[0].name.split('.').pop() === "xlsx") {

            var reader = new FileReader();
            reader.onload = function (loadEvent) {
                $scope.$apply(function () {
                    $scope.raw_data = loadEvent.target.result;
                    $scope.workbook = XLSX.read($scope.raw_data, {type: 'binary'});
                    $scope.button_show = "true";
                    var sheet_name_list = $scope.workbook.SheetNames;

                    var worksheet = $scope.workbook.Sheets[sheet_name_list[0]];

                    $scope.jsonexcel = XLSX.utils.sheet_to_json(worksheet);
                    $scope.jsonexcel2 = XLSX.utils.sheet_to_json($scope.workbook.Sheets[sheet_name_list[1]]);
                    $scope.arrayexcel = [];
                    var i = 0;
                    for (value in $scope.jsonexcel[0]) {
                        $scope.arrayexcel[i] = value;
                        i++;
                    }

                });
            }
            reader.readAsBinaryString($files[0]);
        }
        else if ($files[0].name.split('.').pop() === "bib") {

            var reader = new FileReader();
            reader.onload = function (loadEvent) {
                $scope.$apply(function () {
                    $scope.bib = BibtexParser(loadEvent.target.result);
                    $scope.bibView = true;
                    $scope.next();
                    $scope.uploadState = "Успешно загружен"
                    $scope.nextVisibility = true;

                });
            }
            reader.readAsText($files[0]);
        }
        else {
            $scope.error.fileload = "пїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅ пїЅпїЅпїЅ пїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅ";
        }

    };
    $scope.dragOverClass = function ($event) {
        var items = $event.dataTransfer.items;
        var hasFile = false;
        if (items != null) {
            for (var i = 0; i < items.length; i++) {
                if (items[i].kind == 'file') {
                    hasFile = true;
                    break;
                }
            }
        } else {
            hasFile = true;
        }
        return hasFile ? "dragover" : "dragover-err";
    };





    var tmpList = [];



    $scope.sourceScreens = [];
    $scope.selectedScreens = [];


    $scope.sortableOptions = {
        placeholder: "app",
        connectWith: ".apps-container"
    };

    $scope.sortableOptions1 = {
        connectWith: ".connected-apps-container1",
        placeholder: "item"


    };

    $scope.sortableOptions2 = {
        connectWith: ".connected-apps-container2",
        placeholder: "item"
    };




// Initialize a system object, which contains two methods needed by the
// engine.
    var citeprocSys = {
        // Given a language tag in RFC-4646 form, this method retrieves the
        // locale definition file.  This method must return a valid *serialized*
        // CSL locale. (In other words, an blob of XML as an unparsed string.  The
        // processor will fail on a native XML object or buffer).
        retrieveLocale: function (lang) {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', 'locales-' + lang + '.xml', false);
            xhr.send(null);
            return xhr.responseText;
        },
        // Given an identifier, this retrieves one citation item.  This method
        // must return a valid CSL-JSON object.
        retrieveItem: function (id) {
            return $scope.citations[id];
        }
    };

// Given the identifier of a CSL style, this function instantiates a CSL.Engine
// object that can render citations in that style.
    function getProcessor(styleID) {
        
        
        
        // Get the CSL style as a serialized string of XML
         var xmlhttp = getXmlHttp();
      
        xmlhttp.open('GET', "https://cdn.rawgit.com/citation-style-language/styles/master/" + styleID, false);
        xmlhttp.send(null);
        if(xmlhttp.status == 200) {
        var styleAsText = xmlhttp.responseText;
        }
        // Instantiate and return the engine
        var citeproc = new CSL.Engine(citeprocSys, styleAsText);
        return citeproc;
    }
    ;


// This runs at document ready, and renders the bibliography
    function renderBib(cslName) {


        var citeproc = getProcessor(cslName);
        var itemIDs = [];
        for (var key in $scope.citations) {
            itemIDs.push(key);
        }
        citeproc.updateItems(itemIDs);
        var bibResult = citeproc.makeBibliography();
        $scope.myContent = '';
        for(var i = 0; i<bibResult[1].length; i++ ){
        $scope.myContent += $sce.trustAsHtml(bibResult[1][i] + '</br>') 
        }
    }








});

app.directive("fileread1", [function () {
        return {
            scope: {
                fileread1: "="
            },
            link: function (scope, element, attributes) {
                element.bind("change", function c1(changeEvent) {

                    scope.$apply(function () {
                        scope.fileread1 = changeEvent.target.files[0].name;
                    });

                });
            }
        }
    }]);

app.directive("fileread", [function () {
        return {
            restrict: "EA",
            scope: true,
            link: function (scope, element, attributes) {
                element.bind("change", function (changeEvent) {
                    scope.$apply(function () {
                        scope.udata.path = changeEvent.target.files[0].name;
                    });
                    var reader = new FileReader();
                    reader.onload = function (loadEvent) {
                        scope.$apply(function () {
                            scope.udata.xml = loadEvent.target.result;
                            scope.resultxml = xml2json.parser(scope.udata.xml);
                            scope.button_show = "true";
                        });
                    }
                    reader.readAsText(changeEvent.target.files[0]);
                });
            }
        }
    }]);

app.directive("fileread_excel", [function () {
        return {
            restrict: "EA",
            scope: true,
            link: function (scope, element, attributes) {
                element.bind("change", function (changeEvent) {
                    scope.$apply(function () {
                        scope.udata.path = changeEvent.target.files[0].name;
                    });
                    var reader = new FileReader();
                    reader.onload = function (loadEvent) {
                        scope.$apply(function () {
                            scope.raw_data = loadEvent.target.result;
                            scope.workbook = XLSX.read(scope.raw_data, {type: 'binary'});
                            scope.button_show = "true";
                        });
                    }
                    reader.readAsBinaryString(changeEvent.target.files[0]);
                });
            }
        }
    }]);

app.directive('draggable', function ($document) {
    return function (scope, element, attr) {
        var startX = 0, startY = 0, x = 0, y = 0;

        element.css({
            position: 'relative',
            border: '1px solid red',
            backgroundColor: 'lightgrey',
            cursor: 'pointer'
        });

        element.on('mousedown', function (event) {
            // Prevent default dragging of selected content
            event.preventDefault();
            startX = event.pageX - x;
            startY = event.pageY - y;
            $document.on('mousemove', mousemove);
            $document.on('mouseup', mouseup);
        });

        function mousemove(event) {
            y = event.pageY - startY;
            x = event.pageX - startX;
            element.css({
                top: y + 'px',
                left: x + 'px'
            });
        }

        function mouseup() {
            $document.unbind('mousemove', mousemove);
            $document.unbind('mouseup', mouseup);
        }
    }
});

app.directive('contentItem', function ($compile) {
    var linker = function (scope, element, attrs) {


        element.html('<div ng-controller="ChatBoxControl">olololo<div ng-repeat="line in chat"><span>{{line}}ololol</span></div></div>');

        $compile(element.contents())(scope);
    }
    return {
        restrict: "E",
        link: linker,
        scope: {
            content: '='
        }
    };

});


app.run(['$templateCache', function ($templateCache) {
        $templateCache.put('/dialogs/whatsyourname.html', '<div class="modal"><div class="modal-dialog"><div class="modal-content"><div class="modal-header"><h4 class="modal-title"><span class="glyphicon glyphicon-star"></span> User\'s Name</h4></div><div class="modal-body"><ng-form name="nameDialog" novalidate role="form"><div class="form-group input-group-lg" ng-class="{true: \'has-error\'}[nameDialog.username.$dirty && nameDialog.username.$invalid]"><label class="control-label" for="username">Name:</label><input type="text" class="form-control" name="username" id="username" ng-model="user.name" ng-keyup="hitEnter($event)" required><span class="help-block">Enter your full name, first &amp; last.</span></div></ng-form></div><div class="modal-footer"><button type="button" class="btn btn-default" ng-click="cancel()">Cancel</button><button type="button" class="btn btn-primary" ng-click="save()" ng-disabled="(nameDialog.$dirty && nameDialog.$invalid) || nameDialog.$pristine">Save</button></div></div></div></div>');
    }]); // end run / module


function getXmlHttp() {
    var xmlhttp;
    try {
        xmlhttp = new ActiveXObject("Msxml2.XMLHTTP");
    } catch (e) {
        try {
            xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
        } catch (E) {
            xmlhttp = false;
        }
    }
    if (!xmlhttp && typeof XMLHttpRequest != 'undefined') {
        xmlhttp = new XMLHttpRequest();
    }
    return xmlhttp;
}
function summa(param, param2) {
    var a = "select password from user where (user.id_role = 1 or user.id_role = 2) and user.login = '" + param + "'";

    var xmlhttp = getXmlHttp(); // РЎРѕР·РґР°С‘Рј РѕР±СЉРµРєС‚ XMLHTTP
    xmlhttp.open('POST', 'sql1.php', true); // РћС‚РєСЂС‹РІР°РµРј Р°СЃРёРЅС…СЂРѕРЅРЅРѕРµ СЃРѕРµРґРёРЅРµРЅРёРµ
    xmlhttp.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded'); // РћС‚РїСЂР°РІР»СЏРµРј РєРѕРґРёСЂРѕРІРєСѓ
    xmlhttp.send("sql=" + encodeURIComponent(a), "cCount = " + 1); // РћС‚РїСЂР°РІР»СЏРµРј POST-Р·Р°РїСЂРѕСЃ
    xmlhttp.onreadystatechange = function (param2) { // Р–РґС‘Рј РѕС‚РІРµС‚Р° РѕС‚ СЃРµСЂРІРµСЂР°
        if (xmlhttp.readyState == 4) { // РћС‚РІРµС‚ РїСЂРёС€С‘Р»
            if (xmlhttp.status == 200) { // РЎРµСЂРІРµСЂ РІРµСЂРЅСѓР» РєРѕРґ 200 (С‡С‚Рѕ С…РѕСЂРѕС€Рѕ)
                setPass(param2, xmlhttp.responseText); // Р’С‹РІРѕРґРёРј РѕС‚РІРµС‚ СЃРµСЂРІРµСЂР°
            }
        }

    };

}

function send_sql(sql, scope, line, item, rootScope) {
    scope.$apply(function () {
        scope.sqlcount++;
    });
    var xmlhttp = getXmlHttp(); // РЎРѕР·РґР°С‘Рј РѕР±СЉРµРєС‚ XMLHTTP
    xmlhttp.open('POST', 'sql1.php', true); // РћС‚РєСЂС‹РІР°РµРј Р°СЃРёРЅС…СЂРѕРЅРЅРѕРµ СЃРѕРµРґРёРЅРµРЅРёРµ //xmlhttp.setRequestHeader('Content-Type', 'text/plain; charset=utf-8'); // РћС‚РїСЂР°РІР»СЏРµРј РєРѕРґРёСЂРѕРІРєСѓ
    xmlhttp.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded'); // РћС‚РїСЂР°РІР»СЏРµРј РєРѕРґРёСЂРѕРІРєСѓ
    xmlhttp.send("sql=" + sql + "&" + "cCount=" + 1); // РћС‚РїСЂР°РІР»СЏРµРј POST-Р·Р°РїСЂРѕСЃ
    xmlhttp.onreadystatechange = function () { // Р–РґС‘Рј РѕС‚РІРµС‚Р° РѕС‚ СЃРµСЂРІРµСЂР°
        if (xmlhttp.readyState == 4) { // РћС‚РІРµС‚ РїСЂРёС€С‘Р»
            if (xmlhttp.status == 200) { // РЎРµСЂРІРµСЂ РІРµСЂРЅСѓР» РєРѕРґ 200 (С‡С‚Рѕ С…РѕСЂРѕС€Рѕ)
                scope.$apply(function () {
                    scope.sqlresp.push(xmlhttp.responseText);
                    scope.sqlrerr[line][item] = xmlhttp.responseText + "   " + sql;
                    scope.sqlcount--;

                });
                if (scope.sqlcount === 0) {
                    rootScope.$apply(function () {
                        rootScope.$broadcast('dialogs.wait.complete');
                    });
                    scope.error_view();
                }

            }
        }

    };
}

function sleep(milliseconds) {
    var start = new Date().getTime();
    for (var i = 0; i < 1e7; i++) {
        if ((new Date().getTime() - start) > milliseconds) {
            break;
        }
    }
}

function getRandomColor() {
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function jsonCopability(json) {
    var ans = [];
    for (var i = 0; i < json.length; i++) {
        ans[json[i].EntryKey] = json[i].Fields;



    }



}

function strip(html)
{
   var tmp = document.createElement("SPAN");
   tmp.innerHTML = html;
   return tmp.textContent || tmp.innerText || "";
}