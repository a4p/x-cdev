<?php

//$filesNames = explode(':', substr($_POST["filesNames"], 0, strlen($_POST["filesNames"])));

if (empty($_POST["fileName"]) && empty($_GET["fileName"])) {

    echo '<form enctype="multipart/form-data" action="testUpload.php" method="POST">';
    echo '<input type="hidden" name="user_email" value="user email" />';
    echo '<input type="hidden" name="sendmail" value="send email" />';
    echo '<input type="hidden" name="transactionId" value="transaction id" />';
    echo '<input type="hidden" name="object_id" value="object id" />';
    echo '<input type="hidden" name="mail_body" value="mail body" />';
    echo '<input type="hidden" name="mail_object" value="mail object" />';
    echo '<input type="hidden" name="contacts_email" value="mail contacts" />';
    echo '<input type="hidden" name="fileName" value="fileName" />';
    echo '<input type="hidden" name="fileType" value="fileType" />';
    echo '<input type="hidden" name="fileWsid" value="fileWsid" />';
    echo '<input type="hidden" name="filesNames" value="fileName1:fileName2" />';
    echo '<input type="hidden" name="filesTypes" value="fileType1:fileType2" />';
    echo '<input type="hidden" name="filesWsids" value="fileWsid1:fileWsid2" />';
    echo 'Choose a file to upload: <input name="file" type="file" /><br />';
    echo '<input type="submit" value="UploadFile" />';
    echo '</form>';

} else {

    $inputName = 'file';
    $originalPath = $_FILES[$inputName]['name'];
    $originalName = basename($originalPath);
    $tmpUploadPath = $_FILES[$inputName]['tmp_name'];
    $targetPath = "uploads/" . $originalName;

    if(move_uploaded_file($tmpUploadPath, $targetPath)) {
        echo "The file " . $originalName . " has been uploaded";
    } else{
        echo "There was an error uploading the file, please try again!";
        print "<pre>";
        print_r($_FILES);
        print "</pre>";
    }

}
