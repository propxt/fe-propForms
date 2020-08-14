;(function() {

    'use strict';

    var version = '1.0',
        pluginName = 'Prop Forms';

    $.fn.propForm = function(options, param) {

        var results = [];

        for(var i = 0; i < this.length; i++) {

            var self = $(this[i]);

            if(self.data('instance') == undefined && typeof options != 'string') {

                var instance = new pf(self, options);
                self.data('instance', instance);
                instance.private_methods.initialise();

            } else {

                var instance = self.data('instance');

                if(instance == undefined) {

                    console.log('['+pluginName+' '+version+'] - You\'re trying to fire a method on an element with no instance!');

                } else if(instance.public_methods[options]) {

                    if (this.length > 1) {

                        results.push(instance.public_methods[options](param));

                    } else {

                        return instance.public_methods[options](param);

                    }

                } else {

                    instance.private_methods.error(options + ' is not a defined method!');

                }

            }

        }

        return results;

    }

    function pf(self, options, param) {

        var instance = this;

        instance.defaults = {

            wrapper : '.field-wrap',
            tooltip : true,
            compare : true,
            errorClass : 'error',
            ajax : true,
            pending : null,
            success : null,
            trackers: null

        };

        var settings = $.extend(instance.defaults, options);

        var requiredElements = self.find('*[required]');

        instance.private_methods = {

            error: function(error) {

                if(console) console.warn('['+pluginName+' '+version+'] - ' + error);

            },

            initialise: function() {

                self.attr('novalidate', 'true');

                self.formName = self.attr('id').replace(/-/g, ' ').toLowerCase();

                self.submit(function(e) {

                    self.removeClass('error-form');

                    if(instance.public_methods.validate() == false) {

                        self.addClass('error-form');

                        return false;

                    } else if(settings.ajax) {

                        instance.private_methods.ajax['submit'](e);

                    }

                });

            },

            ajax: {

                submit: function(e) {

                    e.preventDefault();

                    $.ajax({

                        url: self.attr('action'),
                        data: self.serialize() + '&submitted=Send',
                        type: 'POST',

                        beforeSend: function() {

                            if(typeof settings.pending == 'function') {

                                settings.pending.call(self[0]);

                            } else {

                                var welcomeMessage = self.prev('.welcomeText');

                                instance.public_methods.disable();
                                welcomeMessage.text('Working...');

                            }

                        },

                        success: function(data) {

                            var category = 'form (' + self.formName + ')',
                                label = self.formName;

                            try {

                                var form = $(data).find('#'+self.attr('id')),
                                    successMessage = $(data).find('.successText'),
                                    errorMessage = $(data).find('.errorText'),
                                    welcomeMessage = self.prev('.welcomeText');

                                if(welcomeMessage.length > 0) welcomeMessage.remove();

                                if(form.hasClass('form-error')) {

                                    instance.public_methods.sendEvent(category, 'server validation error', label);

                                    self.parent().find('.errorText').remove();

                                    var required = form.find('.error'),
                                        requiredField = required.children('input, select, textarea');

                                    for(var i = 0; i < required.length; i++) {

                                        var element = $(requiredField[i]).attr('id');
                                            element = self.find('#'+element)[0];

                                        element.setAttributeNode(document.createAttribute('required'));

                                    }

                                    requiredElements = self.find('*[required]');

                                    errorMessage.prependTo(self.parent());
                                    instance.public_methods.enable();
                                    instance.public_methods.validate();

                                } else {

                                    instance.public_methods.sendEvent(category, 'successful submission', label);

                                    if(typeof settings.success == 'function') {

                                        settings.success.call(self, {

                                            data: data,
                                            successMessage: successMessage,
                                            errorMessage: errorMessage,
                                            welcomeMessage: welcomeMessage,
                                            instance: instance

                                        });

                                    } else {

                                        self.parent().find('.errorText').remove();
                                        successMessage.prependTo(self.parent());

                                    }

                                }

                                if(successMessage.length === 0 && errorMessage.length === 0) {

                                    console.log('Passed with no success message...');

                                }

                            }

                            catch(e) {

                                instance.public_methods.sendEvent(category, 'fatal error', label);

                                instance.private_methods.error(e);

                            }

                        },

                        error: function(data) {

                            console.error(data);

                            instance.public_methods.sendEvent(category, 'ajax request error', label);

                        }

                    });

                }

            },

            deriveFieldType: function(element) {

                var name = element.attr('name');

                if(name.indexOf('email') > -1) {

                    return 'email';

                } else if(name.indexOf('password') > -1) {

                    return 'password';

                } else if(name.indexOf('name') > -1) {

                    return 'name';

                } else {

                    return name;

                }

            },

            fieldLength: function(data) {

                switch(data) {

                    case 'email':

                        return 3;

                    break;

                    case 'password':

                        return 6;

                    break;

                    case 'name':

                        return 1;

                    break;

                    case 'phone':

                        return 5;

                    break;

                    default:

                        return 0;

                    break;

                }

            },

            errorFields: function(element, type, error) {

                element.closest(settings.wrapper).addClass(settings.errorClass);

                var fieldName = element.attr('name').replace(/-/g, ' ').toLowerCase(),
                    category = 'form (' + self.formName + ')',
                    action = 'client validation error';

                if(type == 'SELECT') {

                    element.next('.select').addClass(settings.errorClass);

                    instance.public_methods.sendEvent(category, action, fieldName + ' (select)');


                } else if(type == 'checkbox' || type == 'radio') {

                    element.closest(settings.wrapper).find('label').addClass(settings.errorClass);

                    if(type == 'checkbox') {

                        instance.public_methods.sendEvent(category, action, fieldName + ' (checkbox)');

                    } else if(type == 'radio') {

                        instance.public_methods.sendEvent(category, action, fieldName + ' (radio)');

                    }

                } else if(element.hasClass('file')) {

                    element.parent().addClass(settings.errorClass);

                    instance.public_methods.sendEvent(category, action, fieldName + ' (file)');

                } else {

                    element.addClass(settings.errorClass);

                    instance.public_methods.sendEvent(category, action, fieldName + ' (other)');

                }

                if(settings.tooltip) {

                    switch(error) {

                        case 'compare' :

                            var message = 'These fields need to match';

                        break;

                        case 'email' :

                            var message = 'Please enter a valid email address';

                        break;

                        case 'check' :

                            var message = 'Please check this field to continue';

                        break;

                        case 'radio' :

                            var message = 'Please check one of the marked fields';

                        break;

                        default :

                            var message = 'Please enter a valid value';

                        break;

                    }

                    var parent = type != 'radio' ? element.closest(settings.wrapper) : element.closest(settings.wrapper).parent(),
                        tooltip = parent.find('.error-tooltip');

                    message = type == 'SELECT' ? 'Please select an option' : message;

                    if(tooltip.length <= 0) {

                        $('<div />', {

                            'class' : 'error-tooltip',
                            'text' : message

                        }).appendTo(parent);

                        tooltip = parent.find('.error-tooltip');

                        setTimeout(function() {

                            tooltip.addClass('active');

                        }, 100);

                    } else {

                        tooltip.text(message);
                        tooltip.addClass('active');

                    }

                    element.focus(function() {

                        tooltip.removeClass('active');

                    });

                    tooltip.click(function() {

                        element.focus();

                    });

                }

            },

            validFields: function(element, type) {

                element.closest(settings.wrapper).removeClass(settings.errorClass);

                if(type == 'SELECT') {

                    element.next('.select').removeClass(settings.errorClass);

                } else if(element.hasClass('file')) {

                    element.parent().removeClass(settings.errorClass);

                } else if(type == 'checkbox') {

                    element.closest(settings.wrapper).find('label').removeClass(settings.errorClass);

                } else {

                    element.removeClass(settings.errorClass);

                }

                element.closest(settings.wrapper).find('.error-tooltip').remove();

            },

            validateEmail: function(email) {

                var validate = /^([^\s\\]+)@((\[[0-9]{1,3}\.)|(([\w-]+\.)+))([a-zA-Z]{2,4}|[0-9]{1,3})(\]?)$/;

                if (validate.test(email)) {

                    return true;

                } else {

                    return false;

                }

            },

            findFields: function(fields, search) {

                var compare = [];

                for(var i = 0; i < fields.length; i++) {

                    var field = $(fields[i]),
                        type = instance.private_methods.deriveFieldType(field);

                    if(type == search) {

                        compare.push(field.attr('name'));

                    }

                }

                return compare;

            },

            compareFields: function(element, type, fields) {

                if(self.find('*[name="'+fields[0]+'"]').val() != self.find('*[name="'+fields[1]+'"]').val()) {

                    instance.private_methods.errorFields(element, type, 'compare');

                } else {

                    instance.private_methods.validFields(element, type);

                }

            }

        }

        instance.public_methods = {

            validate: function() {

                for(var i = 0; i < requiredElements.length; i++) {

                    var type = requiredElements[i].nodeName,
                        requiredElement = $(requiredElements[i]),
                        data = instance.private_methods.deriveFieldType(requiredElement);

                    if(requiredElement.is(':visible') && requiredElement.attr('disabled') != 'disabled' ) {

                        if(data == 'email') {

                            if(instance.private_methods.validateEmail(requiredElement.val()) == false) {

                                instance.private_methods.errorFields(requiredElement, type, data);

                            } else if(instance.private_methods.findFields(requiredElements, data).length > 1 && settings.compare == true) {

                                instance.private_methods.compareFields(requiredElement, type, instance.private_methods.findFields(requiredElements, data));

                            } else {

                                instance.private_methods.validFields(requiredElement, type);

                            }

                        } else if(data == 'password') {

                            if(instance.private_methods.findFields(requiredElements, data).length > 1) {

                                instance.private_methods.compareFields(requiredElement, type, instance.private_methods.findFields(requiredElements, data));

                            } else {

                                instance.private_methods.validFields(requiredElement, type);

                            }

                        } else if(requiredElement.attr('type') == 'checkbox' || requiredElement.attr('type') == 'radio') {

                            switch(requiredElement.attr('type')) {

                                case 'checkbox':

                                    if(!(requiredElement.is(':checked'))) {

                                        instance.private_methods.errorFields(requiredElement, 'checkbox', 'check');

                                    } else {

                                        instance.private_methods.validFields(requiredElement, 'checkbox');

                                    }

                                break;

                                case 'radio':

                                    var radioSet = $('*[name="' + requiredElement.attr('name') + '"]');

                                    if(!(radioSet.is(':checked'))) {

                                        instance.private_methods.errorFields(radioSet, 'radio', 'radio');

                                    } else {

                                        instance.private_methods.validFields(radioSet, 'checkbox');

                                    }

                                break;

                            }

                        } else if(requiredElement.val().length <= instance.private_methods.fieldLength(data)) {
                            instance.private_methods.errorFields(requiredElement, type);
                        } else {

                            instance.private_methods.validFields(requiredElement, type);

                        }

                    } else {

                        requiredElement.removeClass(settings.errorClass);

                    }

                }

                return self.find('.'+settings.errorClass).length > 0 ? false : true;

            },

            updateSettings: function(updates) {

                $.extend(settings, updates);

            },

            enable: function() {

                self.fadeTo(300, 1.0);
                self.find('input, textarea, select, button').removeAttr('disabled');

            },

            disable: function() {

                self.fadeTo(300, 0.2);
                self.find('input, textarea, select, button').attr('disabled', 'disabled');

            },

            sendEvent: function(category, action, label) {

                if (settings.trackers && settings.trackers !== null) {

                    for (var i = 0; i < settings.trackers.length; i++) {

                        ga(settings.trackers[i] + '.send', 'event', category, action, label, true);

                    }

                } else {

                    ga('send', 'event', category, action, label, true);

                }

            }

        }

    }

    function slickForms(options) {

        this.reSkin = function(element) {

            if(element) {

                core_funcs[element].handler();

            } else {

                core_funcs.initialise();

            }

            return 'All wrapped up, slick!';

        }

        var core_funcs = {

            initialise: function() {

                for(var type in core_funcs) {

                    if(core_funcs[type]['handler'] && options[type]) core_funcs[type]['handler']();

                }

            },

            select: {

                handler: function() {

                    var elements = document.getElementsByTagName('select');

                    for (var i = 0; i < elements.length; i++) {

                        if(elements[i].getAttribute('ng-model') || !(elements[i].getAttribute('name') && elements[i].getAttribute('id'))) {

                            continue;

                        }

                        if(elements[i].parentNode.classList ? (!elements[i].parentNode.classList.contains('select-wrap')) : (!new RegExp('(^| )' + 'select-wrap' + '( |$)', 'gi').test(elements[i].parentNode.className))) core_funcs['select'].wrap(elements[i]);

                        if(elements[i].getAttribute('data-label')) {

                            core_funcs['select'].setLabel(elements[i], elements[i].getAttribute('data-label'));

                        } else {

                            core_funcs['select'].check(elements[i]);

                        }
                        core_funcs['select'].bind(elements[i]);

                    }

                },

                wrap: function(element) {

                    element.outerHTML = '<div class="select-wrap">'+element.outerHTML+'<div class="select">'+element.value+'</div></div>';

                },

                bind: function(element) {

                    element.onchange = function() {

                        core_funcs['select'].check(element);

                    }

                },

                check: function(element) {

                    var elementValue = element.value,
                        selectedOption = element.getElementsByTagName('option');

                    for(var i = 0; i < selectedOption.length; i++) {

                        if(selectedOption[i].value != elementValue) {

                            continue;

                        } else {

                            var optionText = selectedOption[i].textContent || selectedOption[i].innerText;

                        }

                    }

                    core_funcs['select'].setLabel(element, optionText);

                },

                setLabel: function(element, value) {

                    element.parentNode.querySelectorAll('.select')[0].innerHTML = value;

                }

            },

            checkbox: {

                handler: function() {

                    var elements = document.getElementsByTagName('input');

                    for (var i = 0; i < elements.length; i++) {

                        if((elements[i].getAttribute('type') != 'checkbox')|| elements[i].getAttribute('data-no-wrap') || (elements[i].parentNode.classList ? (elements[i].parentNode.classList.contains('checkbox-wrap')) : (new RegExp('(^| )' + 'checkbox-wrap' + '( |$)', 'gi').test(elements[i].parentNode.className)))) continue;

                        core_funcs['checkbox'].wrap(elements[i]);
                        core_funcs['checkbox'].check(elements[i]);
                        core_funcs['checkbox'].bind(elements[i]);

                    }

                },

                wrap: function(element) {

                    element.outerHTML = '<div class="checkbox-wrap">'+element.outerHTML+'<div class="checkbox-mark"></div></div>';

                },

                bind: function(element) {

                    $(element).on('change', function() {

                        core_funcs['checkbox'].check(element);

                    });

                },

                check: function(element) {

                    var marker = $(element).parent().find('.checkbox-mark');

                    if($(element).is(':checked')) {

                        marker.addClass('active');

                    } else {

                        marker.removeClass('active');

                    }

                }

            },

            radio: {

                handler: function() {

                    var elements = document.getElementsByTagName('input');

                    for(var i = 0; i < elements.length; i++) {

                        if((elements[i].getAttribute('type') != 'radio') || elements[i].getAttribute('data-no-wrap') || (elements[i].parentNode.classList ? (elements[i].parentNode.classList.contains('radio-wrap')) : (new RegExp('(^| )' + 'radio-wrap' + '( |$)', 'gi').test(elements[i].parentNode.className)))) continue;

                        core_funcs['radio'].wrap(elements[i]);
                        core_funcs['radio'].check(elements[i]);
                        core_funcs['radio'].bind(elements[i]);

                    }

                },

                wrap: function(element) {

                    element.outerHTML = '<div class="radio-wrap">'+element.outerHTML+'<div class="radio-mark"></div></div>';

                },

                bind: function(element) {

                    var elementGroup = document.getElementsByName(element.getAttribute('name'));

                    element.onchange = function() {

                        for(var i = 0; i < elementGroup.length; i++) {

                            core_funcs['radio'].check(elementGroup[i]);

                        }

                    }

                },

                check: function(element) {

                    var marker = element.parentNode.querySelectorAll('.radio-mark')[0];

                    if(element.checked) {

                        marker.classList ? marker.classList.add('active') : marker.className += ' active';

                    } else {

                        marker.classList ? marker.classList.remove('active') :  marker.className = marker.className.replace(new RegExp('active' + className.split(' ').join('|') + 'active', 'gi'), ' ');

                    }

                }

            },

            file: {

                handler: function() {

                    var elements = document.getElementsByTagName('input');

                    for (var i = 0; i < elements.length; i++) {

                        if((elements[i].getAttribute('type') != 'file') || (elements[i].parentNode.classList ? (elements[i].parentNode.classList.contains('file-wrap')) : (new RegExp('(^| )' + 'file-wrap' + '( |$)', 'gi').test(elements[i].parentNode.className)))) continue;

                        core_funcs['file'].wrap(elements[i]);
                        core_funcs['file'].check(elements[i]);
                        core_funcs['file'].bind(elements[i]);

                    }

                },

                wrap: function(element) {

                    element.outerHTML = '<div class="file-wrap">'+element.outerHTML+'<div class="file-button">Choose file(s)</div><div class="file-label"></div></div>';

                },

                bind: function(element) {

                    element.onchange = function() {

                        core_funcs['file'].check(element);

                    }

                },

                check: function(element) {

                    var label = element.parentNode.querySelectorAll('.file-label')[0],
                        button = element.parentNode.querySelectorAll('.file-button')[0];

                    if(!element.value) {

                        label.innerHTML = 'Please select a file(s)';
                        button.innerHTML = 'Choose file(s)';

                    } else {

                        label.innerHTML = '';
                        button.innerHTML = (element.files.length > 1 ? 'Change file(s)' : 'Change file');

                        for(var i = 0; i < element.files.length; i++) {

                            var fileLabel = document.createElement('span');

                            fileLabel.innerHTML = element.files[i].name + (i != element.files.length -1 ? ', ' : '');

                            label.appendChild(fileLabel);

                        }

                    }

                }

            }

        }

        core_funcs.initialise();

    }

    window.slickForms = slickForms;

})();

var logging = function(code, callback, multiple) {

    var self = this,
        progress = 0;

    self.init = function(e) {

        self.check(e.which);

    }

    self.check = function(key) {

        key == code[progress] ? progress++ : progress = 0;
        if(progress == code.length) self.complete();

    }

    self.complete = function() {

        if(multiple !== true) window.onkeyup = null;
        if(typeof callback == 'function') callback.call();

    }

    window.onkeyup = self.init;

};