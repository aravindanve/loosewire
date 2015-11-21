<?php

// loosewire ajax backend

require 'functions.php';

// settings
Register::$base = __FILE__;
Register::$upload_folder = 'uploads';
Register::$project_folder = 'projects';

// init register
Register::init();

// start response
Response::start(true); // true for debug 

// upload project
if (Request::is_type('upload')) {
    if ($result = Project::upload()) {
        Response::exit_with($result);
    } else {
        Response::exit_with(['error' => 'Error uploading file']);
    }
}

// list projects
if (Request::is_type('list')) {
    if ($result = Project::getlist()) {
        Response::exit_with($result);
    } else {
        Response::exit_with(['error' => 'Error fetching projects']);
    }
}

// save project
if (Request::is_type('save', ['file', 'filename'])) {
    $overwrite = Request::has_attr('overwrite', 'true')? true : false;
    if ($result = Project::save($overwrite)) {
        Response::exit_with($result);
    } else {
        Response::exit_with(['error' => 'Error saving file']);
    }
}

// exit with error
Response::exit_with(['error' => 'Bad request']);


// eof