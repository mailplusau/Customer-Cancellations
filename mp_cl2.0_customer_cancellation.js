/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * Author:               Ankith Ravindran
 * Created on:           Wed Apr 19 2023
 * Modified on:          Wed Apr 19 2023 09:04:23
 * SuiteScript Version:  2.0
 * Description:          Client script for the customer cancellation page.
 *
 * Copyright (c) 2023 MailPlus Pty. Ltd.
 */

define([
	"N/runtime",
	"N/search",
	"N/url",
	"N/record",
	"N/format",
	"N/currentRecord",
	"N/email",
], function (runtime, search, url, record, format, currentRecord, email) {
	//require, factory
	var baseURL = "https://1048144.app.netsuite.com";
	if (runtime.EnvType == "SANDBOX") {
		baseURL = "https://system.sandbox.netsuite.com";
	}

	var ctx = runtime.getCurrentScript();

	var zee = 0;
	var role = runtime.getCurrentUser().role;

	var deleted_service_ids = [];
	var deleted_job_ids = [];

	if (role == 1000) {
		// Franchisee
		zee = runtime.getCurrentUser();
	} else if (role == 3) {
		//Administrator
		zee = 6; //test
	} else if (role == 1032) {
		// System Support
		zee = 425904; //test-AR
	}

	var customer_id = null;

	var service_change_delete = [];
	var comm_reg_delete = [];

	function init() {
		$(window).load(function () {
			// Animate loader off screen
			$(".se-pre-con").fadeOut("slow");
		});

		var app = angular.module("myApp", []);
		app.controller("myCtrl", function ($scope) { });

		$(document).on("change", ".input", function (e) {
			pdffile = document.getElementsByClassName("input");

			pdffile_url = URL.createObjectURL(pdffile[0].files[0]);
			$("#viewer").attr("src", pdffile_url);
		});
	}

	function readURL(input) {
		if (input.files && input.files[0]) {
			var reader = new FileReader();

			reader.onload = function (e) {
				$("#output").attr("src", e.target.result);
			};

			reader.readAsDataURL(input.files[0]);
		}
	}

	var item_array = new Array();
	var item_price_array = [];
	var item_price_count = 0;
	var item_count = 0;

	function showAlert(message) {
		$("#alert").html(
			'<button type="button" class="close">&times;</button>' + message
		);
		$("#alert").show();
		document.body.scrollTop = 0; // For Safari
		document.documentElement.scrollTop = 0;

		$(document).on("click", "#alert .close", function (e) {
			$(this).parent().hide();
		});
	}

	function afterSubmit() {
		$(".instruction_div").removeClass("hide");
		$(".requester_header").removeClass("hide");
		$(".date_effective_section").removeClass("hide");
		$(".cancel_reason_div").removeClass("hide");
		$(".cancel_direction_div").removeClass("hide");
		$(".note_section").removeClass("hide");
		$(".loading_section").addClass("hide");
	}

	function showLoadingScreen() {
		console.log("inside showLoadingScreen");
		$(".instruction_div").addClass("hide");
		$(".requester_header").addClass("hide");
		$(".date_effective_section").addClass("hide");
		$(".cancel_reason_div").addClass("hide");
		$(".cancel_direction_div").addClass("hide");
		$(".note_section").addClass("hide");
		$(".loading_section").removeClass("hide");
	}

	function pageInit() {
		$("#alert").hide();
		$("#NS_MENU_ID0-item0").css("background-color", "#CFE0CE");
		$("#NS_MENU_ID0-item0 a").css("background-color", "#CFE0CE");
		$("#body").css("background-color", "#CFE0CE");
		$(".selectator_options").css("list-style-type", "none !important");
		$(".selectator_option_subtitle").css("font-size", "100% !important");
		$(".selectator_option_subtitle").css("color", "#103d39 !important");
		$(".uir-outside-fields-table").css("margin-right", "0%");
		$(".uir-outside-fields-table").css("margin-left", "27.5%");

		var scf_upload = document.getElementsByClassName("input");

		/**
		 * Show the tabs content on click of a tab
		 */
		$(".nav-tabs").on("click", "a", function (e) {
			$(this).tab("show");
		});

		for (var i = 0; i < scf_upload.length; i++) {
			scf_upload[i].className += " form-control";
		}

		$(function () {
			$('[data-toggle="tooltip"]').tooltip();
		});

		var test_record = currentRecord.get();
		customer_id = parseInt(
			test_record.getValue({
				fieldId: "custpage_customer_id",
			})
		);
		var customer_record = record.load({
			type: "customer",
			id: customer_id,
		});
		var zeeLocation = record.load({
			id: customer_record.getValue({
				fieldId: "partner",
			}),
			type: "partner",
		});

		afterSubmit()


		$('#cancel_reason').on('change', function () {
			var cancel_why = $(this).find('option:selected').val();
			var cancel_what = $(this).find('option:selected').attr('data-what');
			var cancel_theme = $(this).find('option:selected').attr('data-theme');

			console.log('cancel_why: ' + cancel_why);
			console.log('cancel_what: ' + cancel_what);
			console.log('cancel_theme: ' + cancel_theme);

			//Cancellation What
			var cancelWhat = record.load({
				type: 'customrecord_linked_list_item',
				id: cancel_what,
			});
			var cancelWhatName = cancelWhat.getValue({
				fieldId: "name",
			});

			$('#cancel_what').val(cancelWhatName);
			$('#cancel_what').attr('data-id', cancel_what);

			//Cancellation Theme
			var cancelTheme = record.load({
				type: 'customrecord_linked_list_item',
				id: cancel_theme,
			});
			var cancelThemeName = cancelTheme.getValue({
				fieldId: "name",
			});

			$('#cancel_theme').val(cancelThemeName);
			$('#cancel_theme').attr('data-id', cancel_theme);


		});
	}

	/**
	 * Converts the date string in the "invoice_date" table to the format of "date_selected".
	 * @param   {String}    invoice_date    ex: '4/6/2020'
	 * @returns {String}    date            ex: '2020-06-04'
	 */
	function dateCreated2DateSelectedFormat(invoice_date) {
		// date_created = '4/6/2020'
		var date_array = invoice_date.split("/");
		// date_array = ["4", "6", "2020"]
		var year = date_array[2];
		var month = date_array[1];
		if (month < 10) {
			month = "0" + month;
		}
		var day = date_array[0];
		if (day < 10) {
			day = "0" + day;
		}
		return year + "-" + month + "-" + day;
	}

	/**
	 * @param   {Number} x
	 * @returns {String} The same number, formatted in Australian dollars.
	 */
	function financial(x) {
		if (typeof x === "string") {
			x = parseFloat(x);
		}
		if (isNullorEmpty(x)) {
			return "$0.00";
		} else {
			return x.toLocaleString("en-AU", {
				style: "currency",
				currency: "AUD",
			});
		}
	}
	/**
	 * [AddJavascript description] - Add the JS to the postion specified in the page.
	 * @param {[type]} jsname [description]
	 * @param {[type]} pos    [description]
	 */
	function AddJavascript(jsname, pos) {
		var tag = document.getElementsByTagName(pos)[0];
		var addScript = document.createElement("script");
		addScript.setAttribute("type", "text/javascript");
		addScript.setAttribute("src", jsname);
		tag.appendChild(addScript);
	}

	/**
	 * [AddStyle description] - Add the CSS to the position specified in the page
	 * @param {[type]} cssLink [description]
	 * @param {[type]} pos     [description]
	 */
	function AddStyle(cssLink, pos) {
		var tag = document.getElementsByTagName(pos)[0];
		var addLink = document.createElement("link");
		addLink.setAttribute("type", "text/css");
		addLink.setAttribute("rel", "stylesheet");
		addLink.setAttribute("href", cssLink);
		tag.appendChild(addLink);
	}

	function stringToDate(val) {
		return format.parse({
			value: val,
			type: format.Type.DATE,
		});
	}

	function isNullorEmpty(strVal) {
		return (
			strVal == null ||
			strVal == "" ||
			strVal == "null" ||
			strVal == undefined ||
			strVal == "undefined" ||
			strVal == "- None -"
		);
	}

	/**
	 * Load the result set of the invoices records linked to the customer.
	 * @param   {String}                customer_id
	 * @param   {String}                invoice_status
	 * @return  {nlobjSearchResultSet}  invoicesResultSet
	 */
	function loadInvoicesSearch(customer_id, invoice_status) {
		var invoicesResultSet;
		if (!isNullorEmpty(customer_id)) {
			var invoicesSearch = search.load({
				id: "customsearch_mp_ticket_invoices_datatabl",
				type: search.Type.INVOICE,
			});
			var invoicesFilterExpression = invoicesSearch.filterExpression;
			invoicesFilterExpression.push("AND");
			invoicesFilterExpression.push([
				"entity",
				search.Operator.IS,
				customer_id,
			]);

			// Open Invoices
			if (invoice_status == "open" || isNullorEmpty(invoice_status)) {
				invoicesFilterExpression.push("AND", [
					"status",
					search.Operator.ANYOF,
					"CustInvc:A",
				]); // Open Invoices
			} else if (invoice_status == "paidInFull") {
				invoicesFilterExpression.push("AND", [
					"status",
					search.Operator.ANYOF,
					"CustInvc:B",
				]); // Paid in Full

				var today_date = new Date();
				var today_day = today_date.getDate();
				var today_month = today_date.getMonth();
				var today_year = today_date.getFullYear();
				var date_3_months_ago = new Date(
					Date.UTC(today_year, today_month - 3, today_day)
				);
				var date_3_months_ago_string = formatDate(date_3_months_ago);
				invoicesFilterExpression.push("AND", [
					"trandate",
					search.Operator.AFTER,
					date_3_months_ago_string,
				]);
			}

			invoicesSearch.filterExpression = invoicesFilterExpression;
			invoicesResultSet = invoicesSearch.run();
		}

		return invoicesResultSet;
	}

	function saveRecord() {
		console.log("inside save record");

		showLoadingScreen();

		var test_record = currentRecord.get();
		var customer = parseInt(
			test_record.getValue({
				fieldId: "custpage_customer_id",
			})
		);
		console.log("customer: " + customer);

		var recCustomer = record.load({
			type: "customer",
			id: customer,
		});

		var partner = recCustomer.getValue({ fieldId: "partner" });
		var zeeRecord = record.load({
			type: record.Type.PARTNER,
			id: partner,
			isDynamic: true,
		});
		zee_email = zeeRecord.getValue({
			fieldId: "email",
		});

		var customer_status = recCustomer.getValue({ fieldId: "entitystatus" });

		var date_effective = $("#date_effective").val();
		var old_date_effective = $("#date_effective").attr("data-olddate");

		var alertMessage = "";

		var saveDateEffective = null;
		if (isNullorEmpty(date_effective)) {
			alertMessage += "Please Enter the Date Effective</br>";
		} else {
			var resultDate = dateEffectiveCheck(date_effective);

			if (resultDate == false) {
				alertMessage +=
					"Entered Date Effective should be greater than today</br>";
			}
			var splitDate = date_effective.split("-");
			var dateEffective =
				splitDate[2] + "/" + splitDate[1] + "/" + splitDate[0];
			var dateEffectiveValue = date_effective;
			saveDateEffective = new Date(dateEffectiveValue);
			saveDateEffective = format.parse({
				value: saveDateEffective,
				type: format.Type.DATE,
			});
			var dateEffectiveValueArray = dateEffectiveValue.split("-");
			var dateEffectiveString =
				dateEffectiveValueArray[2] +
				"/" +
				dateEffectiveValueArray[1] +
				"/" +
				dateEffectiveValueArray[0];
			formatDate(dateEffectiveString);
		}
		if (isNullorEmpty($("#cancel_reason option:selected").val())) {
			alertMessage += "Please Select Cancellation Reason</br>";
		}
		if (isNullorEmpty($('#cancel_theme').attr('data-id'))) {
			alertMessage += "Cancellation Theme has not been prefilled.</br>";
		}
		if (isNullorEmpty($('#cancel_what').attr('data-id'))) {
			alertMessage += "Cancellation What has not been prefilled.</br>";
		}

		if (customer_status == 13) {
			if (isNullorEmpty($("#cancellation_in_out_bound option:selected").val())) {
				alertMessage +=
					"Please Select Cancellation Direction - Inbound or Outbound</br>";
			}

			if (isNullorEmpty($("#cancel_notice option:selected").val())) {
				alertMessage += "Please Select Cancellation Notice</br>";
			}

			var uploadFile = test_record.getValue({
				fieldId: "upload_file_1",
			});

			console.log(uploadFile);

			// if ($("#cancel_notice option:selected").val() != 14) {
			// 	if (isNullorEmpty(uploadFile)) {
			// 		alertMessage += "Please Upload PDF of the cancellation email. </br>";
			// 	}
			// }
		}
		console.log("Validation complete");

		if (alertMessage != "") {
			showAlert(alertMessage);
			afterSubmit();
			return false;
		}

		console.log(alertMessage);

		var emailSubject =
			"Customer Cancellation - " +
			recCustomer.getValue({
				fieldId: "entityid",
			}) +
			" " +
			recCustomer.getValue({
				fieldId: "companyname",
			});

		var emailBody =
			"Customer Name: " +
			recCustomer.getValue({
				fieldId: "entityid",
			}) +
			" " +
			recCustomer.getValue({
				fieldId: "companyname",
			});

		emailBody += "</br></br><u>Cancellation Details:</u>" + "</br>";
		emailBody += "Date: " + saveDateEffective + "</br>";
		emailBody +=
			"Reason: " + $("#cancel_reason option:selected").text() + "</br>";

		emailBody += "</br></br>Notes: </br>" + $("#note").val();

		if (!isNullorEmpty($("#note").val())) {
			var noteBody = $("#note").val().replace(new RegExp("</br>", "g"), "\n");
		} else {
			var noteBody = "";
		}

		console.log('noteBody: ' + noteBody);
		console.log('zee_email: ' + zee_email);
		console.log('emailSubject: ' + emailSubject);
		console.log('emailBody: ' + emailBody);

		test_record.setValue({
			fieldId: "custpage_note",
			value: noteBody,
		});

		test_record.setValue({
			fieldId: "custpage_send_to",
			value: zee_email,
		});

		test_record.setValue({
			fieldId: "custpage_email_subject",
			value: emailSubject,
		});

		test_record.setValue({
			fieldId: "custpage_email_body",
			value: emailBody,
		});

		var customer_record = record.load({
			type: record.Type.CUSTOMER,
			id: parseInt(customer),
			isDynamic: true,
		});

		var companyName = customer_record.getValue({
			fieldId: "companyname",
		});

		customer_record.setValue({
			fieldId: "custentity13",
			value: saveDateEffective,
		});

		if (customer_status == 13) {
			customer_record.setValue({
				fieldId: "custentity_service_cancellation_notice",
				value: $("#cancel_notice option:selected").val(),
			});

			customer_record.setValue({
				fieldId: "custentity_service_cancellation_directio",
				value: $("#cancellation_in_out_bound option:selected").val(),
			});

			if (!isNullorEmpty($("#cancel_comp option:selected").val())) {
				customer_record.setValue({
					fieldId: "custentity14",
					value: $("#cancel_comp option:selected").val(),
				});
			}
		}

		// customer_record.setValue({
		// 	fieldId: "custentity_service_cancellation_reason",
		// 	value: $("#cancel_reason option:selected").val(),
		// });

		//New Set of Cancellation Fields - Theme, What & Why
		customer_record.setValue({
			fieldId: "custentity_service_cancellation_theme",
			value: $('#cancel_theme').attr('data-id'),
		});
		customer_record.setValue({
			fieldId: "custentity_service_cancellation_what",
			value: $('#cancel_what').attr('data-id'),
		});
		customer_record.setValue({
			fieldId: "custentity_service_cancellation_why",
			value: $("#cancel_reason option:selected").val(),
		});



		customer_record.setValue({
			fieldId: "custentity_service_cancelled_by",
			value: runtime.getCurrentUser().id,
		});

		customer_record.setValue({
			fieldId: "custentity_service_cancelled_on",
			value: getDateStoreNS(),
		});

		customer_record.setValue({
			fieldId: "custentity_customer_saved",
			value: 2,
		});

		customer_record.save();

		if (customer_status == 13) {
			var phoneCallRecord = record.create({
				type: record.Type.PHONE_CALL,
				isDynamic: true,
			});

			phoneCallRecord.setValue({
				fieldId: "company",
				value: parseInt(customer),
			});

			phoneCallRecord.setValue({
				fieldId: "startdate",
				value: getDateStoreNS(),
			});

			phoneCallRecord.setValue({
				fieldId: "custevent_organiser",
				value: runtime.getCurrentUser().id,
			});

			phoneCallRecord.setValue({
				fieldId: "custevent_call_type",
				value: 2,
			});

			phoneCallRecord.setValue({
				fieldId: "title",
				value: "Cancellation",
			});

			phoneCallRecord.setValue({
				fieldId: "assigned",
				value: partner,
			});

			phoneCallRecord.setValue({
				fieldId: "status",
				value: "COMPLETE",
			});

			var phoneCallRecordId = phoneCallRecord.save();

			commRegSearch = search.load({
				id: "customsearch_comm_reg_signed",
			});

			commRegSearch.filters.push(
				search.createFilter({
					name: "custrecord_customer",
					operator: search.Operator.IS,
					values: parseInt(customer),
				})
			);

			commRegSearch.run().each(function (searchResult) {
				var commRegID = searchResult.getValue({
					name: "internalid",
				});
				var commRegRecord = record.load({
					type: "customrecord_commencement_register",
					id: commRegID,
				});

				commRegRecord.setValue({
					fieldId: "custrecord_trial_status",
					value: 3,
				});

				var commRegRecordId = commRegRecord.save();

				return true;
			});
		}

		var userNoteRecord = record.create({
			type: record.Type.NOTE,
			isDynamic: true,
		});

		userNoteRecord.setValue({
			fieldId: "entity",
			value: parseInt(customer),
		});

		userNoteRecord.setValue({
			fieldId: "title",
			value: "Cancellation",
		});

		userNoteRecord.setValue({
			fieldId: "direction",
			value: 1,
		});

		userNoteRecord.setValue({
			fieldId: "notetype",
			value: 3,
		});

		userNoteRecord.setValue({
			fieldId: "author",
			value: runtime.getCurrentUser().id,
		});

		userNoteRecord.setValue({
			fieldId: "notedate",
			value: getDateStoreNS(),
		});

		userNoteRecord.setValue({
			fieldId: "note",
			value: noteBody,
		});

		var userNoteRecordId = userNoteRecord.save();

		var startDate = new Date();
		var endDate = new Date();

		format.format({
			value: startDate,
			type: format.Type.DATE,
			timezone: format.Timezone.AUSTRALIA_SYDNEY,
		});

		format.format({
			value: endDate,
			type: format.Type.DATE,
			timezone: format.Timezone.AUSTRALIA_SYDNEY,
		});
		endDate.setHours(startDate.getHours(), startDate.getMinutes() + 15, 0, 0);

		if (customer_status == 13) {
			var task_record = record.create({
				type: "task",
			});

			task_record.setValue({
				fieldId: "startdate",
				value: getDateStoreNS(),
			});
			task_record.setValue({
				fieldId: "duedate",
				value: getDateStoreNS(),
			});

			task_record.setValue({
				fieldId: "company",
				value: customer,
			});

			task_record.setValue({
				fieldId: "timedevent",
				value: true,
			});

			task_record.setValue({
				fieldId: "starttime",
				value: startDate,
			});
			task_record.setValue({
				fieldId: "endtime",
				value: endDate,
			});

			task_record.setValue({
				fieldId: "title",
				value: "Cancellation Processed - " + companyName,
			});

			task_record.setValue({
				fieldId: "custevent_organiser",
				value: runtime.getCurrentUser().id,
			});
			task_record.setValue({
				fieldId: "assigned",
				value: runtime.getCurrentUser().id,
			});
			task_record.setValue({
				fieldId: "status",
				value: "COMPLETE",
			});

			task_record.save({
				ignoreMandatoryFields: true,
			});
		}

		return true;
	}

	function getDateStoreNS() {
		var date = new Date();
		// if (date.getHours() > 6) {
		//     date.setDate(date.getDate() + 1);
		// }

		format.format({
			value: date,
			type: format.Type.DATE,
			timezone: format.Timezone.AUSTRALIA_SYDNEY,
		});

		return date;
	}

	function formatDate(testDate) {
		console.log("testDate: " + testDate);
		var responseDate = format.format({
			value: testDate,
			type: format.Type.DATE,
		});
		console.log("responseDate: " + responseDate);
		return responseDate;
	}

	function onclick_back() {
		var test_record = currentRecord.get();
		var customer = parseInt(
			test_record.getValue({
				fieldId: "custpage_customer_id",
			})
		);
		var sales_record = test_record.getValue({
			fieldId: "custpage_salesrecordid",
		});

		var upload_url = baseURL + "/app/common/entity/custjob.nl?id=" + customer;
		window.open(
			upload_url,
			"_self",
			"height=750,width=650,modal=yes,alwaysRaised=yes"
		);
	}

	function onclick_reset() {
		var test_record = currentRecord.get();
		var customer = parseInt(
			test_record.getValue({
				fieldId: "custpage_customer_id",
			})
		);
		var sales_record = test_record.getValue({
			fieldId: "custpage_salesrecordid",
		});

		var upload_url =
			"https://1048144.app.netsuite.com/app/site/hosting/scriptlet.nl?script=1717&deploy=1&compid=1048144&custid=" +
			customer;
		window.open(
			upload_url,
			"_self",
			"height=750,width=650,modal=yes,alwaysRaised=yes"
		);
	}

	function AddJavascript(jsname, pos) {
		var tag = document.getElementsByTagName(pos)[0];
		var addScript = document.createElement("script");
		addScript.setAttribute("type", "text/javascript");
		addScript.setAttribute("src", jsname);
		tag.appendChild(addScript);
	}

	function AddStyle(cssLink, pos) {
		var tag = document.getElementsByTagName(pos)[0];
		var addLink = document.createElement("link");
		addLink.setAttribute("type", "text/css");
		addLink.setAttribute("rel", "stylesheet");
		addLink.setAttribute("href", cssLink);
		tag.appendChild(addLink);
	}

	function GetFormattedDate(stringDate) {
		var todayDate = nlapiStringToDate(stringDate);
		var month = pad(todayDate.getMonth() + 1);
		var day = pad(todayDate.getDate());
		var year = todayDate.getFullYear();
		return year + "-" + month + "-" + day;
	}

	function pad(s) {
		return s < 10 ? "0" + s : s;
	}

	function dateEffectiveCheck(dateEffective) {
		var date = new Date(dateEffective);

		var today = new Date();

		if (date <= today) {
			return false;
		} else {
			return true;
		}
	}

	function arraysEqual(arr1, arr2) {
		if (arr1.length !== arr2.length) return false;
		for (var i = arr1.length; i--;) {
			if (arr1[i] !== arr2[i]) return false;
		}

		return true;
	}

	/**
	 * [getDate description] - Get the current date
	 * @return {[String]} [description] - return the string date
	 */
	function getDate() {
		var date = new Date();
		date = format.format({
			value: date,
			type: format.Type.DATE,
			timezone: format.Timezone.AUSTRALIA_SYDNEY,
		});

		return date;
	}

	function isNullorEmpty(val) {
		if (val == "" || val == null) {
			return true;
		} else {
			return false;
		}
	}

	return {
		pageInit: pageInit,
		saveRecord: saveRecord,
		onclick_back: onclick_back,
		onclick_reset: onclick_reset,
	};
});
