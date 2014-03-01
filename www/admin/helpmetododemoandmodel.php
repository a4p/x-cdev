<?php
$conn = mysql_connect('localhost', 'root', '');
if (!$conn) {
	die('Could not connect: ' . mysql_error());
}
mysql_select_db('a4p');
$tableName = 'contact';
$sql = 'select * from c4p__'.'contact'.'s';
$result = mysql_query($sql);
if (!$result) {
	die('Query failed: ' . mysql_error());
}
/* get column metadata */
$i = 0;
$column = array();
$type = array();
while ($i < mysql_num_fields($result)) {
	$meta = mysql_fetch_field($result, $i);
	if (!$meta) {
	echo "No information available<br />\n";
	}
	if($meta->name=='id')
	{
		array_push($column,'a4p_id');
	}
	else 
	{
		array_push($column,$meta->name);
	}
	switch ($meta->type){
		case 'string': 
			array_push($type,'TEXT');
			break;
		case 'int':
			array_push($type,'INT');
			break;
		case 'timestamp':
			array_push($type,'DATE');
			break;
	}	
	$i++;
}

$jsonTable = '';
$jsonTable.='var '.$tableName.'JSON = {<br>';
for($i = 0 ; $i<count($column);$i++)
{
	$jsonTable.=$column[$i].': '.'\''.$type[$i].'\',<br>';
	
	
}
$jsonTable.='url: \'TEXT\',<br>';
$jsonTable.='dbid: \'TEXT\'<br>';
$jsonTable.='};';

print $jsonTable;
print '<br><br>';

$j = 0;

$jsonData = '';
$jsonData.='var '.$tableName.'sJSON = [<br>';
while ($row = mysql_fetch_array($result)) {
	if($j>0)
	{
		$jsonData.=',<br>';
	}
	if (!$row) {
		echo "No information available<br />\n";
	}
	
	$jsonData.='{<br>';
	for($i = 0 ; $i<count($column);$i++)
	{
		if($column[$i]=='a4p_id')
		{
			$jsonData.=$column[$i].': '.'\''.$row['id'].'\',<br>';
		}
		else
		{
			$jsonData.=$column[$i].': '.'\''.$row[$column[$i]].'\',<br>';
		}
	}
	$jsonData.='url: \'img/samples/sample_'.$tableName.'_'.substr(('0'.($j+1) ),-2).'.png\',<br>';	
	$jsonData.='dbid: \''.$j.'\'<br>';
	$jsonData.='}';
	//print $jsonData;
	$j++;
	
}
$jsonData.='<br>];';
print $jsonData;
mysql_free_result($result);
		
?>
