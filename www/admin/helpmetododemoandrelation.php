<?php
$conn = mysql_connect('localhost', 'root', '');
if (!$conn) {
	die('Could not connect: ' . mysql_error());
}
mysql_select_db('a4p');

$child = 'event';
$parent = 'document';
// create table relation
$create = '';
$create .= 'var ';
$create .= $parent.'_has_'.$child.'_table';
$create .=' = {<br>';
$create .='parent_'.$parent.'_crm : \'TEXT\',<br>';
$create .='parent_'.$parent.'_id : \'TEXT\',<br>';
$create .='child_'.$child.'_crm : \'TEXT\',<br>';
$create .='child_'.$child.'_id : \'TEXT\',<br>dbid: \'TEXT\'};';

print $create;
print '<br><br>';

$sql = 'select * from c4p__'.'docs where parent_id like \'devent%\';';
$result = mysql_query($sql);
if (!$result) {
	die('Query failed: ' . mysql_error());
}

$insert = '';
$insert .= 'var '.$parent.'_has_'.$child.'_data = [<br>';

$j = 162;
while ($row = mysql_fetch_array($result)) {
	if($j>0)
	{
		$insert.=',<br>';
	}
	if (!$row) {
		echo "No information available<br />\n";
	}
	
	$insert.='{<br>';
	$insert .='"parent_type" : "'.$parent.'",<br>';
	$insert .='"child_type" : "'.$child.'",<br>';
	$insert .='"parent_crm" : "1",<br>';
	$insert .='"parent_id" : "'.$row['id'].'",<br>';
	$insert .='"child_crm" : "1",<br>';
	$insert .='"child_id" : "'.$row['parent_id'].'",<br>';	
	$insert.='"dbid": "'.$j.'"<br>';
	$insert.='}';
	//print $jsonData;
	$j++;
	
}
$insert.='<br>];';
print $insert;

mysql_free_result($result);
		
?>
