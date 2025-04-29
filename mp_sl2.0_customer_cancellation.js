/**
 * @NApiVersion 2.0
 * @NScriptType Suitelet
 * Author:               Ankith Ravindran
 * Created on:           Wed Apr 19 2023
 * Modified on:          Wed Apr 19 2023 09:02:52
 * SuiteScript Version:  2.0
 * Description:          Customer cancellation page.
 *
 * Copyright (c) 2023 MailPlus Pty. Ltd.
 */

define([
	"N/ui/serverWidget",
	"N/runtime",
	"N/search",
	"N/record",
	"N/log",
	"N/redirect",
	"N/error",
	"N/currentRecord",
	"N/file",
	"N/http",
	"N/email",
	"N/format",
], function (
	ui,
	runtime,
	search,
	record,
	log,
	redirect,
	error,
	currentRecord,
	file,
	http,
	email,
	format
) {
	var zee = 0;
	var role = 0;

	var baseURL = "https://1048144.app.netsuite.com";
	if (runtime.EnvType == "SANDBOX") {
		baseURL = "https://1048144-sb3.app.netsuite.com";
	}

	role = runtime.getCurrentUser().role;

	if (role == 1000) {
		zee = runtime.getCurrentUser().id;
	} else if (role == 3) {
		//Administrator
		zee = 6; //test
	} else if (role == 1032) {
		// System Support
		zee = 425904; //test-AR
	}

	var cancellationTheme = [];

	function onRequest(context) {
		var type = "create";

		if (context.request.method === "GET") {
			var customer_id = null;
			var customer_record;
			var entityid;
			var companyName = "";
			var cancellationDirection = "";

			type = context.request.parameters.type;
			customer_id = context.request.parameters.custid;
			cancellationDirection = context.request.parameters.cancellationDirection;

			var cancellationThemeLinkedListSearch = search.load({
				id: "customsearch_linked_list_cancel_themes",
				type: 'customrecord_linked_list_item',
			});

			var oldCancellationTheme = null;
			var oldCancellationThemeText = null;
			var cancellationWhyArray = [];
			var cancellationWhyFilterArray = [];
			var cancellationThemeLength = 0;

			cancellationThemeLinkedListSearch.run().each(function (searchResult) {
				var cancellationWhy = searchResult.getValue({
					name: "internalid", //Why
				});
				var cancellationWhyText = searchResult.getValue({
					name: "name", //Why
				});
				var cancellationWhat = searchResult.getValue({
					name: "custrecord_1319_parent", //What
				});
				var cancellationWhatText = searchResult.getText({
					name: "custrecord_1319_parent", //What
				});

				log.debug({
					title: 'cancellationWhat',
					details: cancellationWhat
				})


				// if (cancellationThemeLength == 0 || oldCancellationTheme == cancellationWhat) {
				// 	log.debug({
				// 		title: 'Themes match > OLD cancellationTheme',
				// 		details: oldCancellationTheme
				// 	})
				cancellationWhyFilterArray[cancellationWhyFilterArray.length] = cancellationWhy;
				cancellationWhyArray.push({
					cancellationWhy: cancellationWhy,
					cancellationWhyText: cancellationWhyText,
				});

				// } else
				if (oldCancellationTheme != cancellationWhat && oldCancellationTheme != null) {
					log.debug({
						title: 'Themes unmatch > OLD cancellationTheme',
						details: oldCancellationTheme
					})
					cancellationTheme.push({
						cancellationWhat: oldCancellationTheme,
						cancellationWhatText: oldCancellationThemeText,
						cancellationWhy: cancellationWhyArray,
					});
					cancellationThemeLength++;

					log.debug({
						title: 'cancellationTheme',
						details: JSON.stringify(cancellationTheme)
					})


					cancellationWhyArray = [];

				}

				oldCancellationTheme = cancellationWhat;
				oldCancellationThemeText = cancellationWhatText;
				return true;
			});

			log.debug({
				title: 'cancellationTheme',
				details: JSON.stringify(cancellationTheme)
			})


			var cancellationThemeLinkedListSearch = search.create({
				type: "customrecord_linked_list_item",
				columns: [
					{
						name: "name",
					},
					{
						name: "internalId",
					},
					{
						name: "custrecord_1319_parent",
					},
				],
				filters: [["isinactive", "is", "false"], "AND", ["custrecord_1319_parent", "anyof", cancellationWhyFilterArray]],
			});

			log.debug({
				title: 'cancellationThemeLinkedListSearch',
				details: cancellationThemeLinkedListSearch.runPaged().count
			})

			var customer_record = record.load({
				type: record.Type.CUSTOMER,
				id: customer_id,
				isDynamic: true,
			});

			entityid = customer_record.getValue({
				fieldId: "entityid",
			});

			companyName = customer_record.getValue({
				fieldId: "companyname",
			});

			zee = customer_record.getValue({
				fieldId: "partner",
			});

			var form = ui.createForm({
				title:
					'Customer Cancellation: <a href="' +
					baseURL +
					"/app/common/entity/custjob.nl?id=" +
					customer_id +
					'">' +
					entityid +
					"</a> " +
					companyName,
			});

			if (!isNullorEmpty(zee)) {
				var zeeRecord = record.load({
					type: record.Type.PARTNER,
					id: zee,
					isDynamic: true,
				});
				var franchisee_name = zeeRecord.getValue({
					fieldId: "companyname",
				});

				zee_main_contact_name = zeeRecord.getValue({
					fieldId: "custentity3",
				});
				zee_email = zeeRecord.getValue({
					fieldId: "email",
				});
				zee_main_contact_phone = zeeRecord.getValue({
					fieldId: "custentity2",
				});
				zee_abn = zeeRecord.getValue({
					fieldId: "custentity_abn_franchiserecord",
				});
			}
			//Customer Status
			customer_status_id = customer_record.getValue({
				fieldId: "entitystatus",
			});
			var cancellation_notice = customer_record.getValue({
				fieldId: "custentity_service_cancellation_notice",
			});

			// Customer Franchisee Text
			zeeText = customer_record.getText({
				fieldId: "partner",
			});

			/**
			 * Description - To add all the API's to the begining of the page
			 */

			var inlineHtml =
				'<script src="https://ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js"></script><script src="//code.jquery.com/jquery-1.11.0.min.js"></script><link rel="stylesheet" type="text/css" href="https://cdn.datatables.net/2.0.7/css/dataTables.dataTables.css"><link rel="stylesheet" type="text/css" href="https://cdn.datatables.net/buttons/3.0.2/css/buttons.dataTables.css"><script type="text/javascript" charset="utf8" src="https://cdn.datatables.net/2.0.7/js/dataTables.js"></script><script type="text/javascript" charset="utf8" src="https://cdn.datatables.net/buttons/3.0.2/js/dataTables.buttons.js"></script><script type="text/javascript" charset="utf8" src="https://cdn.datatables.net/buttons/3.0.2/js/buttons.dataTables.js"></script><script type="text/javascript" charset="utf8" src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script><script type="text/javascript" charset="utf8" src="https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/pdfmake.min.js"></script><script type="text/javascript" charset="utf8" src="https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/vfs_fonts.js"></script><script type="text/javascript" charset="utf8" src="https://cdn.datatables.net/buttons/3.0.2/js/buttons.html5.min.js"></script><script type="text/javascript" charset="utf8" src="https://cdn.datatables.net/buttons/3.0.2/js/buttons.print.min.js"></script><link href="//netdna.bootstrapcdn.com/bootstrap/3.3.2/css/bootstrap.min.css" rel="stylesheet"><script src="//netdna.bootstrapcdn.com/bootstrap/3.3.2/js/bootstrap.min.js"></script><script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyA92XGDo8rx11izPYT7z2L-YPMMJ6Ih1s0&callback=initMap&libraries=places"></script><link rel="stylesheet" href="https://system.na2.netsuite.com/core/media/media.nl?id=2060796&c=1048144&h=9ee6accfd476c9cae718&_xt=.css"/><script src="https://system.na2.netsuite.com/core/media/media.nl?id=2060797&c=1048144&h=ef2cda20731d146b5e98&_xt=.js"></script><link type="text/css" rel="stylesheet" href="https://system.na2.netsuite.com/core/media/media.nl?id=2090583&c=1048144&h=a0ef6ac4e28f91203dfe&_xt=.css"><script src="https://cdn.datatables.net/searchpanes/1.2.1/js/dataTables.searchPanes.min.js"><script src="https://cdn.datatables.net/select/1.3.3/js/dataTables.select.min.js"></script><script src="https://code.highcharts.com/highcharts.js"></script><script src="https://code.highcharts.com/modules/data.js"></script><script src="https://code.highcharts.com/modules/exporting.js"></script><script src="https://code.highcharts.com/modules/accessibility.js"></script></script><script src="https://code.highcharts.com/highcharts.js"></script><script src="https://code.highcharts.com/modules/data.js"></script><script src="https://code.highcharts.com/modules/drilldown.js"></script><script src="https://code.highcharts.com/modules/exporting.js"></script><script src="https://code.highcharts.com/modules/export-data.js"></script><script src="https://code.highcharts.com/modules/accessibility.js"></script>';
			inlineHtml +=
				'<link href="https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/css/select2.min.css" rel="stylesheet" /><script src="https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/js/select2.min.js"></script>';
			inlineHtml +=
				'<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-select@1.13.14/dist/css/bootstrap-select.min.css">';
			inlineHtml +=
				'<script src="https://cdn.jsdelivr.net/npm/bootstrap-select@1.13.14/dist/js/bootstrap-select.min.js"></script>';
			// Semantic Select
			inlineHtml +=
				'<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/semantic-ui/2.2.13/semantic.min.css">';
			inlineHtml +=
				'<script src="https://cdnjs.cloudflare.com/ajax/libs/semantic-ui/2.2.13/semantic.min.js"></script>';

			inlineHtml +=
				"<style>.mandatory{color:red;} .body{background-color: #CFE0CE !important;}.wrapper{position:fixed;height:2em;width:2em;overflow:show;margin:auto;top:0;left:0;bottom:0;right:0;justify-content: center; align-items: center; display: -webkit-inline-box;} .ball{width: 22px; height: 22px; border-radius: 11px; margin: 0 10px; animation: 2s bounce ease infinite;} .blue{background-color: #0f3d39; }.red{background-color: #095C7B; animation-delay: .25s;}.yellow{background-color: #387081; animation-delay: .5s}.green{background-color: #d0e0cf; animation-delay: .75s}@keyframes bounce{50%{transform: translateY(25px);}}.select2-selection__choice{ background-color: #095C7B !important; color: white !important}.select2-selection__choice__remove{color: red !important;}</style>";

			inlineHtml += loadingSection();

			inlineHtml +=
				'<div class="container" style="padding-top: 3%;"><div id="alert" class="alert alert-danger fade in "></div></div>';

			inlineHtml +=
				'<div class="container instruction_div hide" style="background-color: #d9f2ff;font-size: 14px;padding: 15px;border-radius: 10px;border: 1px solid;box-shadow: 0px 1px 26px -10px white;"><b>Purpose</b>:</br>This page is used to record the cancellation of a customer account.  All fields marked with an asterisk (*) are mandatory.</br><ul><li><b>DATE EFFECTIVE</b>: Date the cancellation takes effect</li><li><b>CANCELLATION REASON</b>: Select from a dropdown list of predefined reasons</li><li><b>CANCELATION WHAT/THEME</b>: The Cancellation Theme and What will be preselecetd based on the cancellation reason selected.</li><li><b>CANCELLATION NOTICE</b>: How was Head Office notified of the cancellation?</li><li><b>INBOUND/OUTBOUND</b>:<ul><li>Inbound: Customer initiated the cancellation </li><li>Outbound: Head office initiated the cancellation</li></ul></li><li><b>NOTES</b>: Optional field for any additional information relevant to the cancellation, such as specific details about the reason, customer feedback, or actions taken.</li></ul></div></br>';

			// Load DataTables
			inlineHtml +=
				'<link rel="stylesheet" type="text/css" href="//cdn.datatables.net/1.10.21/css/jquery.dataTables.min.css">';
			inlineHtml +=
				'<script type="text/javascript" charset="utf8" src="//cdn.datatables.net/1.10.21/js/jquery.dataTables.min.js"></script>';

			// if (cancellation_notice == 14) {
			// 	form
			// 		.addField({
			// 			id: "upload_file_1",
			// 			label: "SERVICE CANCELLATION PROOF - PDF FILE ONLY",
			// 			type: ui.FieldType.FILE,
			// 		})
			// 		.updateLayoutType({
			// 			layoutType: ui.FieldLayoutType.OUTSIDEBELOW,
			// 		}).isMandatory;
			// } else {
			form
				.addField({
					id: "upload_file_1",
					label: "SERVICE CANCELLATION PROOF - PDF FILE ONLY",
					type: ui.FieldType.FILE,
				})
				.updateLayoutType({
					layoutType: ui.FieldLayoutType.OUTSIDEBELOW,
				})
			// }

			inlineHtml +=
				'<div class="form-group container open_invoices requester_header hide">';
			inlineHtml += '<div class="row">';
			inlineHtml += '<div class="col-xs-12 heading2">';
			inlineHtml +=
				'<h4><span class="label label-default col-xs-12" style="background-color: #095c7b;">SERVICE CANCELLATION DETAILS</span></h4>';
			inlineHtml += "</div>";
			inlineHtml += "</div>";
			inlineHtml += "</div>";

			inlineHtml += '<div class="form-group container date_effective_section hide">';
			inlineHtml += '<div class="row">';

			inlineHtml +=
				'<div class="col-xs-12 "><div class="input-group"><span class="input-group-addon">DATE EFFECTIVE <span class="mandatory" style="color:red">*</span></span><input type="date" id="date_effective" value="" class="form-control date_effective"/></div></div>';

			inlineHtml += "</div>";
			inlineHtml += "</div>";

			inlineHtml += "</select></div></div>";
			inlineHtml += "</div>";
			inlineHtml += "</div>";

			inlineHtml += '<div class="form-group container cancel_reason_div hide">';
			inlineHtml += '<div class="row">';

			inlineHtml +=
				'<div class="col-xs-4 cancel_reason"><div class="input-group"><span class="input-group-addon" id="cancel_reason_text">CANCELATION REASON <span class="mandatory" style="color:red">*</span></span><select id="cancel_reason" class="form-control cancel_reason" ><option></option>';

			var cancellation_reason_search = search.create({
				type: "customlist58",
				columns: [
					{
						name: "name",
					},
					{
						name: "internalId",
					},
				],
				filters: ["isinactive", "is", "false"],
			});

			cancellationThemeLinkedListSearch.run().each(function (searchResult) {
				var listValue = searchResult.getValue("name");
				var listID = searchResult.getValue("internalId");
				var parentWhatID = searchResult.getValue("custrecord_1319_parent");

				var parentThemeID = null;

				for (var i = 0; i < cancellationTheme.length; i++) {
					for (var r = 0; r < cancellationTheme[i].cancellationWhy.length; r++) {
						if (cancellationTheme[i].cancellationWhy[r].cancellationWhy == parentWhatID) {
							parentThemeID = cancellationTheme[i].cancellationWhat;
							break;
						}
					}
				}

				inlineHtml +=
					'<option value="' + listID + '" data-what="' + parentWhatID + '" data-theme="' + parentThemeID + '">' + listValue + "</option>";

				return true;
			});
			inlineHtml += "</select></div></div>";

			inlineHtml +=
				'<div class="col-xs-4 cancel_what"><div class="input-group"><span class="input-group-addon" id="cancel_reason_text">CANCELATION WHAT <span class="mandatory" style="color:red">*</span></span><input id="cancel_what" value="" readonly class="form-control" type="text" data-id=""/>';
			inlineHtml += "</div></div>";

			inlineHtml +=
				'<div class="col-xs-4 cancel_theme"><div class="input-group"><span class="input-group-addon" id="cancel_reason_text">CANCELATION THEME <span class="mandatory" style="color:red">*</span></span><input id="cancel_theme" value="" readonly class="form-control" type="text" data-id=""/>';
			inlineHtml += "</div></div>";

			inlineHtml += "</div>";
			inlineHtml += "</div>";

			inlineHtml += '<div class="form-group container cancel_direction_div hide">';
			inlineHtml += '<div class="row">';

			inlineHtml +=
				'<div class="col-xs-4 cancel_comp"><div class="input-group"><span class="input-group-addon" id="cancellation_in_out_bound_text">INBOUND/OUTBOUND <span class="mandatory" style="color:red">*</span></span><select id="cancellation_in_out_bound" class="form-control cancellation_in_out_bound" ><option></option>';

			var inbound_outbound_search = search.create({
				type: "customlist_in_outbound",
				columns: [
					{
						name: "name",
					},
					{
						name: "internalId",
					},
				],
				filters: ["isinactive", "is", "false"],
			});

			inbound_outbound_search.run().each(function (searchResult) {
				var listValue = searchResult.getValue("name");
				var listID = searchResult.getValue("internalId");

				if (cancellationDirection == listID) {
					inlineHtml +=
						'<option value="' +
						listID +
						'" selected>' +
						listValue +
						"</option>";
				} else {
					inlineHtml +=
						'<option value="' + listID + '">' + listValue + "</option>";
				}

				return true;
			});
			inlineHtml += "</select></div></div>";



			inlineHtml +=
				'<div class="col-xs-4 cancel_notice"><div class="input-group"><span class="input-group-addon" id="cancel_notice_text">CANCELATION NOTICE <span class="mandatory" style="color:red">*</span></span><select id="cancel_notice" class="form-control cancel_notice" ><option></option>';

			var industry_search = search.create({
				type: "customlist_cancellation_notice",
				columns: [
					{
						name: "name",
					},
					{
						name: "internalId",
					},
				],
				filters: ["isinactive", "is", "false"],
			});

			industry_search.run().each(function (searchResult) {
				var listValue = searchResult.getValue("name");
				var listID = searchResult.getValue("internalId");
				inlineHtml +=
					'<option value="' + listID + '">' + listValue + "</option>";

				return true;
			});
			inlineHtml += "</select></div></div>";

			inlineHtml +=
				'<div class="col-xs-4 cancel_comp"><div class="input-group"><span class="input-group-addon" id="cancel_comp_text">CANCELLATION COMPETITOR</span><select id="cancel_comp" class="form-control cancel_comp" ><option></option>';

			var industry_search = search.create({
				type: "customlist33",
				columns: [
					{
						name: "name",
					},
					{
						name: "internalId",
					},
				],
				filters: ["isinactive", "is", "false"],
			});

			industry_search.run().each(function (searchResult) {
				var listValue = searchResult.getValue("name");
				var listID = searchResult.getValue("internalId");
				inlineHtml +=
					'<option value="' + listID + '">' + listValue + "</option>";

				return true;
			});
			inlineHtml += "</select></div></div>";
			inlineHtml += "</div>";
			inlineHtml += "</div>";

			inlineHtml += '<div class="form-group container note_section hide">';
			inlineHtml += '<div class="row">';
			inlineHtml +=
				'<div class="col-xs-12 note"><div class="input-group"><span class="input-group-addon" id="note_text">NOTE </span><textarea id="note" class="form-control note" rows="4" cols="50"  /></textarea></div></div>';
			inlineHtml += "</div>";
			inlineHtml += "</div>";

			inlineHtml += "</div>";
			inlineHtml += "</div>";

			// inlineHtml += openInvoicesSection();

			form
				.addField({
					id: "custpage_customer_id",
					type: ui.FieldType.TEXT,
					label: "Customer ID",
				})
				.updateDisplayType({
					displayType: ui.FieldDisplayType.HIDDEN,
				}).defaultValue = parseInt(customer_id);

			form
				.addField({
					id: "custpage_customer_entityid",
					type: ui.FieldType.TEXT,
					label: "Customer ID",
				})
				.updateDisplayType({
					displayType: ui.FieldDisplayType.HIDDEN,
				}).defaultValue = entityid;

			form
				.addField({
					id: "custpage_customer_franchisee",
					type: ui.FieldType.TEXT,
					label: "Franchisee ID",
				})
				.updateDisplayType({
					displayType: ui.FieldDisplayType.HIDDEN,
				}).defaultValue = zee;

			form
				.addField({
					id: "custpage_note",
					type: ui.FieldType.TEXT,
					label: "Note",
				})
				.updateDisplayType({
					displayType: ui.FieldDisplayType.HIDDEN,
				});

			form
				.addField({
					id: "custpage_email_body",
					type: ui.FieldType.TEXT,
					label: "Email Body",
				})
				.updateDisplayType({
					displayType: ui.FieldDisplayType.HIDDEN,
				});

			form
				.addField({
					id: "custpage_email_subject",
					type: ui.FieldType.TEXT,
					label: "Email Body",
				})
				.updateDisplayType({
					displayType: ui.FieldDisplayType.HIDDEN,
				});

			form
				.addField({
					id: "custpage_sale_type",
					type: ui.FieldType.TEXT,
					label: "Email Body",
				})
				.updateDisplayType({
					displayType: ui.FieldDisplayType.HIDDEN,
				});

			form
				.addField({
					id: "custpage_send_to",
					type: ui.FieldType.TEXT,
					label: "Email Body",
				})
				.updateDisplayType({
					displayType: ui.FieldDisplayType.HIDDEN,
				});

			form.addSubmitButton({
				label: "Submit",
			});

			form
				.addField({
					id: "preview_table",
					label: "inlinehtml",
					type: "inlinehtml",
				})
				.updateLayoutType({
					layoutType: ui.FieldLayoutType.STARTROW,
				}).defaultValue = inlineHtml;

			form.addResetButton({
				id: "reset",
				label: "Reset",
				functionName: "onclick_reset()",
			});

			form.addButton({
				id: "back",
				label: "Back",
				functionName: "onclick_back()",
			});

			form.clientScriptFileId = 6332354;

			context.response.writePage(form);
		} else {
			var customerId = context.request.parameters.custpage_customer_id;
			var fileObj = context.request.files.upload_file_1;
			var note = context.request.parameters.custpage_note;
			var emailBody = context.request.parameters.custpage_email_body;
			var emailSubject = context.request.parameters.custpage_email_subject;
			var zee_email = context.request.parameters.custpage_send_to;

			log.debug({
				title: "customerId",
				details: customerId,
			});

			var proofid = null;

			if (!isNullorEmpty(fileObj)) {
				fileObj.folder = 3630868;
				var file_type = fileObj.fileType;
				if (file_type == "PDF") {
					file_type == "pdf";
					var file_name =
						getDatePDF() + "_" + parseInt(customerId) + "." + file_type;
					var file_name =
						getDatePDF() +
						"_service_change_notification_" +
						parseInt(customerId) +
						"." +
						file_type;
				}
				fileObj.name = file_name;

				if (file_type == "PDF") {
					// Create file and upload it to the file cabinet.
					proofid = fileObj.save();
				} else {
					error.create({
						message: "Must be in PDF format",
						name: "PDF_ERROR",
						notifyOff: true,
					});
				}
			}

			var customer_record = record.load({
				type: record.Type.CUSTOMER,
				id: parseInt(customerId),
				isDynamic: true,
			});

			var fileEmailAttachObj = null;

			if (!isNullorEmpty(proofid)) {
				customer_record.setValue({
					fieldId: "custentity_cancel_proof",
					value: proofid,
				});

				fileEmailAttachObj = file.load({
					id: proofid,
				});
			}

			customer_record.save();

			// var userNoteRecord = record.create({
			//     type: record.Type.NOTE,
			//     isDynamic: true
			// });

			// userNoteRecord.setValue({
			//     fieldId: 'entity',
			//     value: customer_id
			// });

			// userNoteRecord.setValue({
			//     fieldId: 'title',
			//     value: 'Cancellation'
			// });

			// userNoteRecord.setValue({
			//     fieldId: 'direction',
			//     value: 1
			// });

			// userNoteRecord.setValue({
			//     fieldId: 'notetype',
			//     value: 3
			// });

			// userNoteRecord.setValue({
			//     fieldId: 'author',
			//     value: runtime.getCurrentUser().id
			// });

			// userNoteRecord.setValue({
			//     fieldId: 'notedate',
			//     value: getDateStoreNS()
			// });

			// userNoteRecord.setValue({
			//     fieldId: 'note',
			//     value: note
			// });

			// var userNoteRecordId = userNoteRecord.save();
			if (!isNullorEmpty(fileEmailAttachObj)) {
				email.send({
					author: 112209,
					recipients: [zee_email],
					subject: emailSubject,
					body: emailBody,
					cc: [
						"fiona.harrison@mailplus.com.au",
						"sarah.hart@mailplus.com.au",
						"popie.popie@mailplus.com.au", "madillon.campos@mailplus.com.au", "alexandra.bathman@mailplus.com.au", "beatriz.lima@mailplus.com.au"
					],
					attachments: [fileEmailAttachObj],
					relatedRecords: {
						entityId: parseInt(customerId),
					},
				});
			} else {
				email.send({
					author: 112209,
					recipients: [zee_email],
					subject: emailSubject,
					body: emailBody,
					cc: [
						"fiona.harrison@mailplus.com.au",
						"sarah.hart@mailplus.com.au",
						"popie.popie@mailplus.com.au", "madillon.campos@mailplus.com.au", "alexandra.bathman@mailplus.com.au", "beatriz.lima@mailplus.com.au"
					],
					relatedRecords: {
						entityId: parseInt(customerId),
					},
				});
			}

			context.response.sendRedirect({
				type: http.RedirectType.RECORD,
				identifier: record.Type.CUSTOMER,
				id: parseInt(customerId),
			});
		}
	}

	/**
 * The header showing that the results are loading.
 * @returns {String} `inlineQty`
 */
	function loadingSection() {
		var inlineHtml =
			'<div class="wrapper loading_section" style="height: 10em !important;left: 50px !important">';
		inlineHtml += '<div class="row">';
		inlineHtml += '<div class="col-xs-12 ">';
		inlineHtml += '<h1 style="color: #095C7B;">Loading</h1>';
		inlineHtml += "</div></div></div></br></br>";
		inlineHtml += '<div class="wrapper loading_section">';
		inlineHtml += '<div class="blue ball"></div>';
		inlineHtml += '<div class="red ball"></div>';
		inlineHtml += '<div class="yellow ball"></div>';
		inlineHtml += '<div class="green ball"></div>';

		inlineHtml += "</div>";

		return inlineHtml;
	}

	/**
	 * A Datatable displaying the open invoices of the customer
	 * @param   {Number}    ticket_id
	 * @param   {String}    selector_type
	 * @return  {String}    inlineHtml
	 */
	function openInvoicesSection() {
		var hide_class_section = "";
		// Open invoices header
		var inlineHtml =
			'<div class="form-group container open_invoices open_invoices_header ' +
			hide_class_section +
			'">';
		inlineHtml += '<div class="row">';
		inlineHtml += '<div class="col-xs-12 heading2">';
		inlineHtml +=
			'<h4><span class="label label-default col-xs-12" style="background-color: #095c7b;">OPEN INVOICES</span></h4>';
		inlineHtml += "</div></div></div>";

		// Open invoices dropdown field
		inlineHtml +=
			'<div class="form-group container open_invoices invoices_dropdown ' +
			hide_class_section +
			'">';
		inlineHtml += '<div class="row">';
		inlineHtml += '<div class="col-xs-12 invoices_dropdown_div">';
		inlineHtml += '<div class="input-group">';
		inlineHtml +=
			'<span class="input-group-addon" id="invoices_dropdown_text">INVOICE STATUS</span>';
		inlineHtml += '<select id="invoices_dropdown" class="form-control">';
		inlineHtml += '<option value="open" selected>Open</option>';
		inlineHtml +=
			'<option value="paidInFull">Paid In Full (last 3 months)</option>';
		inlineHtml += "</select>";
		inlineHtml += "</div></div></div></div>";

		// Open Invoices Datatable
		inlineHtml +=
			'<div class="form-group container open_invoices open_invoices_table ' +
			hide_class_section +
			'">';
		inlineHtml += '<div class="row">';
		inlineHtml += '<div class="col-xs-12" id="open_invoice_dt_div">';
		// It is inserted as inline html in the script mp_cl_open_ticket
		inlineHtml += "</div></div></div>";

		return inlineHtml;
	}

	function getDateStoreNS() {
		var date = new Date();
		if (date.getHours() > 6) {
			date.setDate(date.getDate() + 1);
		}

		format.format({
			value: date,
			type: format.Type.DATE,
			timezone: format.Timezone.AUSTRALIA_SYDNEY,
		});

		return date;
	}

	function getDatePDF() {
		var date = new Date();
		// if (date.getHours() > 6) {
		//     date = nlapiAddDays(date, 1);

		// }
		// date.setHours(date.getHours() + 17);
		var date_string =
			date.getFullYear() +
			"" +
			(date.getMonth() + 1) +
			"" +
			date.getDate() +
			"_" +
			date.getHours() +
			"" +
			date.getMinutes();

		return date_string;
	}

	function pad(s) {
		return s < 10 ? "0" + s : s;
	}

	function GetFormattedDate(stringDate) {
		var todayDate = nlapiStringToDate(stringDate);
		var month = pad(todayDate.getMonth() + 1);
		var day = pad(todayDate.getDate());
		var year = todayDate.getFullYear();
		return year + "-" + month + "-" + day;
	}

	function isNullorEmpty(val) {
		if (val == "" || val == null) {
			return true;
		} else {
			return false;
		}
	}

	return {
		onRequest: onRequest,
	};
});
