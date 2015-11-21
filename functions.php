<?php 

// loosewire backend functions

defined('_DS_') or define('_DS_', DIRECTORY_SEPARATOR);

class Register 
{
    static $base = __FILE__;
    static $upload_folder = 'uploads';
    static $project_folder = 'projects';

    static $target_path = null;

    static function init() 
    {
        self::$target_path = dirname(self::$base)._DS_;

        self::$upload_folder = self::$target_path.rtrim(
            self::$upload_folder, _DS_)._DS_;

        self::$project_folder = self::$target_path.rtrim(
            self::$project_folder, _DS_)._DS_;
    }
}

class Response 
{
    static function start($debug = false) // call before exit_with
    {   
        if ($debug) {
            error_reporting(E_ALL);
            ini_set('display_errors', 1);
        }      

        ob_start();
        header('Content-Type: application/json');
    }

    static function exit_with($data = null) 
    {
        is_array($data) or $data = [];
        isset($data['error']) or $data['error'] = false;
        isset($data['output']) or $data['output'] = (
            ob_get_level()? ob_get_clean() : '');

        echo json_encode($data);
        die;
    }
}

class Request 
{
    static function is_type($get, $post = null) 
    {
        if (is_string($get)) $get = [$get];
        if (is_string($post)) $post = [$post];
        if (!is_array($get) or !count($get)) {
            return false;
        }
        is_array($post) or $post = [];
        if (!isset($_GET)) return false;

        foreach ($get as $key) {
            if (!isset($_GET[$key])) return false;
        }
        if (count($post)) {
            return self::has_attrs($post);
        }
        return true;
    }

    static function has_attrs($post) 
    {
        if (!is_array($post) or !count($post)) {
            return false;
        }
        foreach ($post as $key) {
            if (!self::has_attr($key)) {
                return false;
            }
        }
        return true;
    }

    static function has_attr($key, $enforce = false) {
        if (!isset($_POST, $_POST[$key])) {
            return false;
        }
        if ($enforce and ($enforce != $_POST[$key])) {
            return false;
        }
        return true;
    }
}

class Project {
    static function _get_unused_filename($filename)  
    {
        if (!file_exists(Register::$project_folder.$filename)) {
            return $filename;
        } else {
            $seconds = 0;
            while ($seconds < 5) {
                $part = [];
                $part[0] = gmdate('Ymd');
                $part[1] = gmdate('Ymd-His');
                $part[2] = gmdate('Ymd-His').
                    '-'.preg_replace('/\s.*$/', '', microtime());

                foreach ($part as $suffix) {
                    $new_filename = preg_replace(
                        '/\.lw\.json$/i', '-'.$suffix."$0", 
                        $filename);
                    if (!file_exists(Register::$project_folder.
                        $new_filename)) {
                        return $new_filename;
                    }
                }
                $seconds++;
                sleep(1);
            }
        }
    }

    static function _check_integrity($file) 
    {
        if (empty(trim($file))) {
            return false;
        }
        $json = json_decode($file, true);

        if ((null == $json) or (false == $json)) {
            echo 'Error decoding file: '.json_last_error();
            return false;
        }
        if (!isset(
                $json, 
                $json['_meta'], 
                $json['_meta']['name'], 
                $json['_meta']['created'], 
                $json['project'], 
                $json['project']['canvas'])) {
            echo 'Project attributes missing';
            return false;
        }
        return $json;
    }

    static function _get_project($filepath) 
    {
        if (!file_exists($filepath)) {
            return false;
        }
        $contents = file_get_contents($filepath);
        $json = self::_check_integrity($contents);

        if ($json) {
            return $json;
        }
        return false;
    }

    static function _get_project_meta($filepath)
    {
        if ($json = self::_get_project($filepath)) {
            isset($json['_meta']['modified']) or
                $json['_meta']['modified'] = $json['_meta']['created'];
            return $json['_meta'];
        } else {
            return false;
        }
    }

    static function _check_valid_filename($filename) 
    {
        if (preg_match(
                '/^[a-z0-9_\-]+\.lw\.json$/i', 
                $_POST['filename'])) {
            return true;
        }
        return false;
    }

    static function upload() 
    {
        if (isset($_FILES) and !empty($_FILES)) {
            $temp_file = $_FILES['file']['tmp_name'];
            $target_file = Reg::$upload_folder.$_FILES['file']['name'];

            if (move_uploaded_file($temp_file, $target_file)) {
                return ['filename' => $_FILES['file']['name']];
            } else {
                return false;
            }
        }
    }

    static function getlist() 
    {
        $files = glob(Register::$project_folder.'*.lw.json');
        $_passed_files = [];
        if (count($files)) {
            foreach ($files as $file) {
                $meta = self::_get_project_meta($file);
                if ($meta) {
                    $_passed_files[] = [
                        'name' => $meta['name'],
                        'modified' => $meta['modified'],
                        'filename' => basename($file),
                    ];
                }
            }
        }
        return ['projectsList' => $_passed_files];
    }

    static function overwrite() {

    }

    static function save($overwrite = false) {
        if (!self::_check_valid_filename($_POST['filename'])) {
            return ['error' => 'Invalid filename'];
        }
        $filename = $_POST['filename'];
        $__newfile = false;

        if ($file = self::_check_integrity($_POST['file'])) {
            $file['_meta']['modified'] = gmdate('c', time());
            $file['_meta']['filetype'] = 'loosewire project json';
            $file['_meta'][
                'getapp'] = 'http://github.com/aravindanve/loosewire';
            $file['_meta']['savestamp'] = md5(microtime()).md5(rand());
            $encoded_file = json_encode($file, JSON_PRETTY_PRINT);
            $md5_str = md5($encoded_file);

            if (true == $overwrite) {
                // overwrite
                $result = file_put_contents(
                    Register::$project_folder.$filename, 
                    $encoded_file);
            } else {
                // new file
                $__newfile = true;
                if ($new_filename = self::_get_unused_filename($filename)) {
                    $result = file_put_contents(
                        Register::$project_folder.$new_filename, 
                        $encoded_file);
                    $filename = $new_filename;
                } else {
                    return ['error' => 'Error saving file'];
                }
            }

        } else {
            return ['error' => 'Invalid file'];
        }

        // check if file has been saved
        if (file_exists(
                Register::$project_folder.$filename)) {
             $saved_file = file_get_contents(
                Register::$project_folder.$filename);
        } else {
            return ['error' => 'Unable to open saved file'];
        }
        if (false === $saved_file) {
            return ['error' => 'Unable to open saved file'];
        }
        if (md5($saved_file) === $md5_str) {
            $data = ['filename' => $filename];
            if ($__newfile) {
                $data['file'] = $file;
            }
            return $data;
        } else {
            return ['error' => Register::$project_folder.
                'File MD5s do not match'];
        }
    }
}



// eof