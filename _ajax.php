<?php

// loosewire ajax backend

require 'functions.php';

// settings
_reg::$main_file = __FILE__;
_reg::$upload_folder = 'uploads';
_reg::$projects_folder = 'projects';

// start response
_res::start(true); // true for debug 

// upload project
if (_req::is_type('upload')) {

}

// list projects
if (_req::is_type('list')) {
    
}

// save project
if (_req::is_type('save', ['file', 'filename'])) {
    
}

// exit with error
_res::exit_with(['error' => 'bad request']);



$upload_folder = 'uploads';
$projects_folder = 'projects';

$ds = DIRECTORY_SEPARATOR;

error_reporting(E_ALL);
ini_set('display_errors', 1);

ob_start();
header('Content-Type: application/json');

function send($res = null) {
    is_array($res) or $res = [];
    isset($res['error']) or $res['error'] = false;
    isset($res['output']) or $res['output'] = (ob_get_level()? 
        ob_get_clean() : '');
    echo json_encode($res);
    die;
}

$data = [];

// upload project
if (isset(
        $_GET, 
        $_GET['upload'])) {
    if (isset($_FILES) and !empty($_FILES)) {
        $temp_file = $_FILES['file']['tmp_name'];
        $target_path = dirname(__FILE__).$ds.$upload_folder.$ds;
        $target_file = $target_path.$_FILES['file']['name'];
        echo var_dump(move_uploaded_file($temp_file, $target_file));
        $data['upload'] = $_FILES['file']['name'];

        echo var_dump($_FILES['file']['tmp_name']);
    }
    send($data);
}

// list projects
if (isset(
        $_GET,
        $_GET['list'])) {
    $data['projectsList'] = [];

    // temp
    $data['projectsList'][] = [
        'name' => 'My First Project',
        'modified' => date('Y-m-d H:i:s T'),
        'filename' => 'my-first-project.lw.json',
    ];
    // $data['projectsList'] = [];
    send($data);
}

// save project
if (isset(
        $_GET, 
        $_GET['save'], 
        $_POST, 
        $_POST['file'], 
        $_POST['filename'])) {
    if (empty(trim($_POST['file']))) {
        send(['error' => 'empty file']);
    }
    if (empty(trim($_POST['filename']))) {
        send(['error' => 'empty filename']);
    }
    if (!preg_match('/^[a-z0-9_\-]+\.lw\.json$/i', $_POST['filename'])) {
        send(['error' => 'invalid filename']);
    }
    $filename = $_POST['filename'];
    $file = json_decode($_POST['file'], true);
    if ((null == $file) or (false == $file)) {
        send(['error' => 'error decoding file: '.
            json_last_error()]);
    }
    if (!isset(
            $file, 
            $file['_meta'], 
            $file['_meta']['name'], 
            $file['_meta']['created'], 
            $file['project'], 
            $file['project']['canvas'])) {
        send(['error' => 'project attributes missing']);
    }
    $file['_meta']['modified'] = gmdate('c', time());
    $file['_meta']['filetype'] = 'loosewire project json';
    $file['_meta']['getapp'] = 'http://github.com/aravindanve/loosewire';
    $file['_meta']['savestamp'] = md5(microtime()).md5(rand());
    $encoded_file = json_encode($file, JSON_PRETTY_PRINT);
    $md5_str = md5($encoded_file);
    $target_path = dirname(__FILE__).$ds.$projects_folder.$ds;
    if (isset($_POST['overwrite']) and ('true' == $_POST['overwrite'])) {
        // save as
        $result = file_put_contents(
            $target_path.$filename, 
            $encoded_file);
    } else {
        // new file
        if (!file_exists($target_path.$filename)) {
            // save
            $result = file_put_contents(
                $target_path.$filename, 
                $encoded_file);
        } else {
            $_secs = 0; 
            while ($_secs < 5) {
                $_filesaved = false;
                $_filename = [];
                $_filename[0] = gmdate('Ymd');
                $_filename[1] = gmdate('Ymd-His');
                $_filename[2] = gmdate('Ymd-His').
                '-'.preg_replace('/\s.*$/', '', microtime());
                foreach ($_filename as $_filestamp) {
                    $_filename_new = preg_replace(
                        '/\.lw\.json$/i', '-'.$_filestamp."$0", $filename);
                    if (!file_exists($target_path.$_filename_new)) {
                        // save
                        $result = file_put_contents(
                            $target_path.$_filename_new, 
                            $encoded_file);
                        $filename = $_filename_new;
                        $_filesaved = true;
                        break;
                    } 
                }
                if ($_filesaved) {
                    break;
                } else {
                    $_secs++;
                    sleep(1);
                }
            }
        }
    }
    // check if file has been created 
    try {
        $saved_file = file_get_contents(
            $target_path.$filename);
    } catch (Exception $e) {
        send(['error' => 'error confirming if '.
            'file was successfully saved']);
    }
    if (md5($saved_file) === $md5_str) {
        send(['filename' => $filename]);
    } else {
        send(['error' => 'file md5s do not match']);
    }
}

// exit with error
send(['error' => 'bad request']);

// eof