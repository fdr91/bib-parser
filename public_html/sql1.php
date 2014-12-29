<?php

header('Content-type: text/plain; charset=utf-8');
$dblocation = "localhost";
$dbname = "mk_6";
$dbuser = "root";
$dbpasswd = "1234"; /* ������� ������ ������� �� ������� ��� 
  ��������� MySQL */
$dbcnx = @mysql_connect($dblocation, $dbuser, $dbpasswd);
if (!$dbcnx) {
    echo "�� �������� ������ mySQL";
    exit();
}
if (!@mysql_select_db($dbname, $dbcnx)) {
    echo "�� �������� ���� ������";
    exit();
}

$sql1 = $_POST['sql'];
$count = $_POST['cCount'];
//$sql1 = "select * from result";
//echo $sql1;

$ver = mysql_query($sql1);
if (!$ver) {
    echo "������ � �������";
    echo mysql_error($dbcnx);
    exit();
}
if (is_bool($ver)) {
    exit();
}
if (!mysql_num_rows($ver)) {
    exit();
}
$i = 0;

mysql_data_seek($ver, 0);
$row = mysql_fetch_array($ver, MYSQL_NUM);
while ($row) {
    while ($i < $count) {
        if (!is_null($row[$i])) {
            echo $row[$i] . "<1>";
        } else {
            echo "NULL" . "<1>";
        }

        $i++;
    }
    $i = 0;
    echo ":-:";
    $row = mysql_fetch_array($ver, MYSQL_NUM);
}



//echo mysql_result($ver, 0);
?> 