(function ($, window) {

    var DEBUG = true,
        clog = function (obj) {
            if (DEBUG) {
                console.log(obj);
            }
        },

        __register      = {},
        __loadedProject = {
            _meta:          null,
            _filename:      null,
            project:        null
        },
        __backend       = 'ajax.php',

        l = __register,

        $markupDepot = $('#markupDepot'),

        $menuBar        = $('#menuBar'),
        $newBtn         = $('#newProject'),
        $createBtn      = $('#createProject'),
        $openBtn        = $('#openProject'),
        $saveBtn        = $('#saveChanges'),
        $saveAsBtn      = $('#saveAsProject'),
        $discardBtn     = $('#discardChanges'),
        $toggleEditBtn  = $('#toggleEditMode'),
        $projectBtn     = $('#projectProperties'),

        $newProjectNameField = $('#newProjectName'),

        $modeLabel      = $('#modeLabel'),
        $modeStatus     = $('#modeStatus'),

        $modal                  = $('#modal'),
        $closeModalBtn          = $('#closeModal'),
        $errorModal             = $('#errorModal'),
        $newProjectModal        = $('#newProjectModal'),
        $openProjectModal       = $('#openProjectModal'),
        $projectPropertiesModal = $('#projectPropertiesModal'),
        $mustSaveOrDiscardModal = $('#mustSaveOrDiscardModal'),

        $errorModalMessage          = $('#errorModalMessage'),
        $selectProjectToOpenList    = $('#selectProjectToOpen');

    // initialize properties

    l.readonly = l.readonly || true;
    l.unsavedChanges = l.unsavedChanges || false;
    l.modalActive = l.modalActive || false;

    l.projectOpen = l.projectOpen || false;

    __loadedProject = {
        _meta: null,
        _filename: null,
        project: null,
    }; 

    // functions

    var undef,
    isString = function (obj) {
        if ('string' === typeof obj) {
            return true;
        } else {
            return false;
        }
    },
    isNonEmptyString = function (obj, ignoreSpaces) {
        ignoreSpaces = ignoreSpaces || true;
        if (isString(obj) && 
            (ignoreSpaces? obj.trim().length > 0 : true)) {
            return true;
        } else {
            return false;
        }
    },
    isArray = function (obj) {
        if ('[object Array]' === Object.prototype.toString.call(obj)) {
            return true;
        } else {
            return false;
        }
    },
    isObject = function (obj) {
        if ('object' === typeof obj) {
            return true;
        } else {
            return false;
        }
    },
    hasKey = function (obj, key) {
        if (isObject(obj) && obj.hasOwnProperty(key)) {
            return true;
        } else {
            return false;
        }
    },
    hasElem = function ($obj, ignoreLength) {
        ignoreLength = ignoreLength || false;
        if (($obj instanceof $) && 
            (ignoreLength? true : $obj.length)) {
            return true;
        }
        return false;
    },
    __apply = function (next, context) {
        context = context || window;
        args = [];
        if (arguments.length > 2) {
            for (var i = 2; i < arguments.length; i++) {
                args.push(arguments[i]);
            }
        }
        if ('function' === typeof next) {
            return next.apply(context, args);
        }
    },
    isProjectOpen = function () {
        if (false === l.projectOpen) {
            return false;
        } else {
            return true;
        }
    },
    inEditMode = function () {
        if (l.projectOpen && (false === l.readonly)) {
            return true;
        } else {
            return false;
        }
    },
    hasUnsavedChanges = function () {
        if (l.projectOpen && (false !== l.unsavedChanges)) {
            return true;
        } else {
            return false;
        }
    },
    isModalOpen = function () {
        if ('none' === $modal.css('display')) {
            return false;
        } else {
            return true;
        }
    },
    showControl = function ($elem, animate, duration, next) {
        animate = animate || false;
        duration = duration || 200;
        if (!isArray($elem)) {
            $elem = [$elem];
        }
        for (index in $elem) {
            (function ($elemItem) {
                setTimeout(function () {
                    $elemItem.stop(true, true);
                    if (animate) {
                        $elemItem.data('animating', 'yes');
                        $elemItem.css('opacity', '0');
                        $elemItem.css('display', '');
                        $elemItem.animate({
                            opacity: 1
                        }, duration, function () {
                            $(this).css('opacity', '');
                            $(this).data('animating', 'no');
                            __apply(next, this);
                        });
                    } else {
                        $elemItem.css('opacity', '');
                        $elemItem.css('display', '');
                        __apply(next, $elemItem.get(0));
                    }
                }, animate? 10 : 1);
            })($elem[index]);
        }
    },
    hideControl = function ($elem, animate, duration, next) {
        animate = animate || false;
        duration = duration || 200;
        if (!isArray($elem)) {
            $elem = [$elem];
        }
        for (index in $elem) {
            (function ($elemItem) {
                setTimeout(function () {
                    $elemItem.stop(true, true);
                    if (animate) {
                        $elemItem.data('animating', 'yes');
                        $elemItem.animate({
                            opacity: 0
                        }, duration, function () {
                            $(this).css('display', 'none');
                            $(this).css('opacity', '');
                            $(this).data('animating', 'no');
                            __apply(next, this);
                        });
                    } else {
                        $elemItem.css('display', 'none');
                        __apply(next, $elemItem.get(0));
                    }
                }, animate? 10 : 1);
            })($elem[index]);
        }
    },
    newFromDepot = function (depotId) {
        return $markupDepot
            .children('[data-depot-id="' + depotId + '"]')
            .clone();
    },
    refreshUI = function () {
        clog('refreshing UI');
        if (isProjectOpen()) {
            showControl([
                $toggleEditBtn,
                $projectBtn,
                $modeLabel.parent()
            ]);
        } else {
            hideControl([
                $toggleEditBtn,
                $projectBtn,
                $modeLabel.parent()
            ]);
        }
        if (inEditMode()) {
            showControl([
                $saveBtn,
                $saveAsBtn,
                $discardBtn
            ]);
            $menuBar.removeClass('readonly');
            $modeLabel.empty().append('Edit Mode');
            if (hasUnsavedChanges()) {
                $modeStatus.empty().append(': Unsaved Changes');
            } else {
                $modeStatus.empty();
            }
        } else {
            hideControl([
                $saveBtn,
                $saveAsBtn,
                $discardBtn
            ]);
            $menuBar.addClass('readonly');
            $modeLabel.empty().append('Readonly');
            $modeStatus.empty();
        }
        if (!l.modalActive && isModalOpen()) {
            // quick close modal
            hideControl($modal);
            deactivateModals();
        }
    },
    activateModal = function ($modalRef) {
        deactivateModals($modalRef);
        showControl($modal, true, 150, function () {
            l.modalActive = $modalRef;
            $modalRef.find('input').first().focus();
        });
    },
    deactivateModals = function ($except) {
        if ('undefined' !== typeof $except) {
            showControl($except);
            hideControl($modal.find('.modal-item').not($except));
        } else {
            hideControl($modal.find('.modal-item'));
            l.modalActive = false;
        }
    },
    isModalActive = function ($modalRef) {
        if ($modalRef === l.modalActive) {
            return true;
        }
        return false;
    },
    closeModal = function () {
        hideControl($modal, true, null, function () {
            deactivateModals();
        });
    },
    showErrorModal = function (message) {
        message = message || 'Oops there was an error!';
        $errorModalMessage
            .empty().append(message);
        activateModal($errorModal);
    },
    makeRequest = function (type, data, success, error, complete) {
        $.ajax({
            url: __backend + '?' + type + '=true',
            method: 'POST',
            data: data || null,
            success: success || function (resp) {},
            error: error || function (xhr, text, error) {

            },
            complete: complete || function (xhr, status) {}
        });
    },
    loadProject = function (filename, fileobj) {
        if (!isNonEmptyString(filename)) {
            return false;
        }
        if (!filename.match(/^[a-z0-9_\-]+\.lw\.json$/i)) {
            return false;
        }
        if (!hasKey(fileobj, '_meta') ||
            !hasKey(fileobj._meta, 'name') ||
            !hasKey(fileobj._meta, 'created') ||
            !hasKey(fileobj, 'project') ||
            !hasKey(fileobj.project, 'canvas')) {
            return false;
        }
        __loadedProject._meta = fileobj._meta;
        __loadedProject._filename = filename;
        __loadedProject.project = fileobj.project;
        l.projectOpen = true;
        refreshUI();
        return true;
    },
    buildNewProject = function (name) {
        var name = (name || 'My Loosewire Project')
                .trim(),
            file = JSON.stringify({
                _meta: {
                    name: name,
                    created: (new Date())
                        .toISOString()
                        .replace(/\.[0-9]*Z$/i, '+00:00')
                },
                project: {
                    canvas: {}
                }
            }, null, 4),
            filename = name
                .trim()
                .toLowerCase()
                .replace(/[\s\.]+/g, '-')
                .replace(/[^a-z0-9_\-]/gi, '') + 
                '.lw.json';
        return {
            name: name,
            file: file,
            filename: filename
        };
    },
    createNewProject = function (name, next) {
        if (!isNonEmptyString(name)) {
            throw new Error('Project must have a name');
        }
        var newProject = buildNewProject(name);
        makeRequest('save', {
            file: newProject.file,
            filename: newProject.filename
        }, function (resp) {
            if (!resp.error) {
                if ((undef !== resp.file) &&
                    loadProject(resp.filename, 
                        resp.file)) {
                    __apply(next, null);
                } else {
                    showErrorModal('Could not load project');
                }
            } else {
                showErrorModal(resp.error);
            }
        });
    },
    newProjectSubmit = function () {
        // handle project in edit
        if (inEditMode()) {
            toggleEditMode();
        }
        disableElem($createBtn);
        createNewProject(
            $newProjectNameField.val(), function () {
                $newProjectNameField.val('');
                if (isModalActive($newProjectModal)) {
                    closeModal();
                }
                enableElem($createBtn);
            });
    },
    newProject = function () {
        // handle project in edit
        if (inEditMode()) {
            toggleEditMode();
        }
        // new project prompt
        activateModal($newProjectModal);
    },
    refreshOpenProjectModal = function (next) {
        makeRequest('list', null , function (resp) {
            if (!resp.error) {
                $selectProjectToOpenList.empty();
                for (i in resp.projectsList) {
                    var $listItem = newFromDepot(
                        'projects-list:project');
                    $listItem
                        .find('[data-project-name]')
                        .empty()
                        .append(resp.projectsList[i].name)
                        .end()
                        .find('[data-project-modified]')
                        .empty()
                        .append(resp.projectsList[i].modified)
                        .end()
                        .find('[data-project-filename]')
                        .empty()
                        .append(resp.projectsList[i].filename)
                        .end()
                        .appendTo($selectProjectToOpenList);
                }
                if (!$selectProjectToOpenList.children().length) {
                    $selectProjectToOpenList.append(
                        newFromDepot('common:message')
                            .find('[data-message-text]')
                            .empty()
                            .append('No projects here')
                            .end());
                }
                __apply(next, $openProjectModal.get(0));
            } else {
                showErrorModal(resp.error);
            }
        });
    },
    openProject = function () {
        // handle project in edit
        if (inEditMode()) {
            toggleEditMode();
        }
        // open project modal
        refreshOpenProjectModal(function () {
            activateModal($(this));
        });
    },
    saveChanges = function () {

    },
    saveAsProject = function () {
        
    },
    discardChanges = function () {
        
    },
    toggleEditMode = function () {
        if (inEditMode()) {
            exitEditProject();
        } else {
            editProject();
        }
    },
    editProject = function () {
        if (!isProjectOpen()) return false;
        l.readonly = false;
    },
    exitEditProject = function () {
        if (!isProjectOpen()) return false;
        if (hasUnsavedChanges()) {
            activateModal($mustSaveOrDiscardModal);
        } else {
            l.readonly = true;
        }
    },
    projectProperties = function () {
        if (!isProjectOpen()) return false;
        activateModal($projectPropertiesModal);
    },
    onKeyCode = function (code, next) {
        return function (e) {
            var keyCode = e.which || e.keyCode;
            if (code === keyCode) {
                return __apply(next, this, e);
            }
            return true;
        };
    },
    disableElem = function ($elem) {
        if (hasElem($elem)) {
            $elem.attr('data-disabled', 'true');
        }
    },
    enableElem = function ($elem) {
        if (hasElem($elem)) {
            $elem.removeAttr('data-disabled');
        }
    },
    isDisabled = function ($elem) {
        if (hasElem($elem)) {
            if ($elem.filter(':disabled').length ||
                $elem.hasClass('disabled') ||
                $elem.filter('[data-disabled]').length) {
                return true;
            }
        }
        return false;
    },
    ifNotDisabled = function (next) {
        return function (e) {
            if (!isDisabled($(this))) {
                return __apply(next, this, e);
            } else {
                return false;
            }
        };
    };

    // register events 
    $newBtn.on('click', function (e) {
        e.preventDefault();
        newProject();
    });
    $createBtn.on('click', ifNotDisabled(function (e) {
        e.preventDefault();
        newProjectSubmit();
    }));
    $newProjectNameField.on('keypress', 
        onKeyCode(13, function (e) {
            $(this).blur();
            $createBtn.trigger('click');
        }));
    $openBtn.on('click', function (e) {
        e.preventDefault();
        openProject();
    });
    $saveBtn.on('click', function (e) {
        e.preventDefault();
        saveChanges();
    });
    $saveAsBtn.on('click', function (e) {
        e.preventDefault();
        saveAsProject();
    });
    $discardBtn.on('click', function (e) {
        e.preventDefault();
        discardChanges();
    });
    $toggleEditBtn.on('click', function (e) {
        e.preventDefault();
        toggleEditMode();
    });
    $closeModalBtn.on('click', function (e) {
        e.preventDefault();
        closeModal();
    });
    $('body').on('click', '.closeModal', function (e) {
        e.preventDefault();
        closeModal();
    });
    $('body').on('keyup', onKeyCode(27, function (e) {
        if (isModalOpen()) {
            closeModal();
            return false;
        }
    }));
    $('body').on('keyup', onKeyCode(13, function (e) {
        if (isModalOpen() && hasElem(l.modalActive)) {
            l.modalActive
                .find('[data-default-btn]')
                .trigger('click');
        }
    }));
    $('#logo').on('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
    });

    refreshUI();

    if (DEBUG) {
        window.__loosewire_internal = {
            message:           'non __vars are read only',
            backend:            __backend,
            __register:         __register,
            __loadedProject:    __loadedProject
        };
    }

    // temp
    // activateModal($openProjectModal);
    // openProject();

})(jQuery, window);

// eof