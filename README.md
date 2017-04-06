propForms
============

v1.0.2 Update
---

Moved initialisation out of the propForms.js file and used jQuery to style up checkboxes in slickForms.

propForms is a complete solution for all of our form needs! It combines form styling and validation into one neat package that handles every form on the site without the need for initialisation.

Implementation
---

Include the script document in your template, this will allow it to fire on every page that has a form.

	<script src="/assets/js/libs/propForms.js" type="text/javascript"></script>

Add the required attribute onto any elements that you wish to validate e.g

	<input type="text" name="example" required />

	<select name="selectExample" required>
		<option value="" selected>Default selection</option>
		<option value="option1" selected>Option 1</option>
	</select>

	<input type="email" name="email" required />

Options
---

The default options are as follows:

	wrapper : '.field-wrap',
	tooltip : true,
	compare : true,
	errorClass : 'error',
	ajax : true
	pending : null,
	success : null,
	trackers: null

* wrapper - The wrapper class for your fields
* tooltip - Do you want tooltips to appear? true or false
* compare - Do you want the form to compare fields it thinks have confirmation boxes? true or false
* errorClass - The class that's outputted on the field wrap and the element if it fails validation.
* ajax - Do you want the form to submit via ajax? true or false
* pending - A custom function that will get fired as the form is pending submission.
* success - A custom function that will get fired if the form passes validation.
* trackers - Pass namespaces for multiple GA trackers

All of the options can be updated with the 'updateSettings' method in your main scripts file for example.

	$('#random-form-selector').propForm('updateSettings', {

		wrapper : '.new-wrapper',
		tooltip: false,
		trackers: ['0', '1', '2']

	});

Form settings can be updated at any time, even after page load or on click of an element etc.

Methods
---

There are a number of accessible methods to propForms, they are as follows:

	$('#random-form-selector').propForm('validate') // Validates the selected form, and returns true or false, can be passed through to multiple and return an array.
	
	$('#random-form-selector').propForm('updateSettings', { 

		wrapper : '.new-wrapper',
		tooltip : false

	}); // Updates any settings to the selected form, can be passed through to all forms on the site.

	$('#random-form-selector').propForm('disable') // Disable the selected form
	$('#random-form-selector').propForm('enable') // Enable the selected form

I plan to add more in the future that will allow you simulate successful and unsuccessful form submissions.

Form Styling
---

The form styling uses slickForms, you can find the full info here: https://github.com/WsCandy/SlickForms

To install just place the _forms.scss file into your sass directory and reference it in your main.scss. This sass file will add all the default styles to get slickForms working correctly.