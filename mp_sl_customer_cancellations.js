/**
 
 *@NApiVersion 2.0
 *@NScriptType Suitelet

 */


define(['N/ui/serverWidget', 'N/email', 'N/runtime', 'N/search', 'N/record', 'N/http', 'N/log', 'N/redirect'],
	function (ui, email, runtime, search, record, http, log, redirect) {
		function onRequest(context) {

			var baseURL = 'https://1048144.app.netsuite.com';
			if (runtime.EnvType == "SANDBOX") {
				baseURL = 'https://system.sandbox.netsuite.com';
			}
			var zee = 0;
			var role = runtime.getCurrentUser().role;

			if (role == 1000) {
				zee = runtime.getCurrentUser().id;
			} else if (role == 3) { //Administrator
				zee = 6; //test
			} else if (role == 1032) { // System Support
				zee = 425904; //test-AR
			}


			if (context.request.method === 'GET') {

				var customer_id = context.request.parameters.custid;

				var script_id = context.request.parameters.scriptid;
				if (isNullorEmpty(script_id)) {
					script_id = null;
				}
				var deploy_id = context.request.parameters.deployid;
				if (isNullorEmpty(deploy_id)) {
					deploy_id = null;
				};
				// customer_id = 586137;

				var customer_record;
				var entityid;
				var companyName = '';
				var abn = '';
				var zeeText = '';
				var accounts_email = '';
				var accounts_phone = '';
				var daytodayemail = '';
				var daytodayphone = '';
				var ap_mail_parcel = '';
				var ap_outlet = '';
				var lpo_customer = '';
				var customer_status = '';
				var customer_status_id = '';
				var lead_source = '';
				var lead_source_text = '';
				var customer_industry = '';
				var multisite = '';
				var website = '';
				var savedNoteSearch = null;

				log.debug({
					title: 'Customer ID',
					details: customer_id
				});


				var customer_record = record.load({
					type: record.Type.CUSTOMER,
					id: customer_id,
					isDynamic: true
				});

				entityid = customer_record.getValue({
					fieldId: 'entityid'
				});

				companyName = customer_record.getValue({
					fieldId: 'companyname'
				});

				abn = customer_record.getValue({
					fieldId: 'vatregnumber'
				});

				zee = customer_record.getValue({
					fieldId: 'partner'
				});

				zeeText = customer_record.getText({
					fieldId: 'partner'
				});

				accounts_email = customer_record.getValue({
					fieldId: 'email'
				});

				accounts_phone = customer_record.getValue({
					fieldId: 'altphone'
				});

				daytodayemail = customer_record.getValue({
					fieldId: 'custentity_email_service'
				});

				daytodayphone = customer_record.getValue({
					fieldId: 'phone'
				});

				ap_mail_parcel = customer_record.getValue({
					fieldId: 'custentity_ap_mail_parcel'
				});

				ap_outlet = customer_record.getValue({
					fieldId: 'custentity_ap_outlet'
				});

				lpo_customer = customer_record.getValue({
					fieldId: 'custentity_ap_lpo_customer'
				});

				customer_status = customer_record.getText({
					fieldId: 'entitystatus'
				});

				customer_status_id = customer_record.getValue({
					fieldId: 'entitystatus'
				});

				lead_source = customer_record.getValue({
					fieldId: 'leadsource'
				});

				lead_source_text = customer_record.getText({
					fieldId: 'leadsource'
				});

				customer_industry = customer_record.getValue({
					fieldId: 'custentity_industry_category'
				});

				multisite = customer_record.getValue({
					fieldId: 'custentity_category_multisite'
				});

				if (multisite == 'T') {
					multisite = 1;
				} else {
					multisite = 2;
				}

				website = customer_record.getValue({
					fieldId: 'custentity_category_multisite_link'
				});


				savedNoteSearch = search.load({
					id: 'customsearch_user_note'
				});

				savedNoteSearch.filters.push(search.createFilter({
					name: 'internalid',
					join: 'Customer',
					operator: search.Operator.IS,
					values: customer_id
				}));

				var form = ui.createForm({
					title: 'Customer Cancellation: ' + entityid + ' ' + companyName
				});

				var customerID = form.addField({
					id: 'custpage_customerid',
					type: ui.FieldType.TEXT,
					label: ' '
				}).updateDisplayType({
					displayType: ui.FieldDisplayType.HIDDEN
				}).defaultValue = customer_id;

				var zeeID = form.addField({
					id: 'custpage_zeeid',
					type: ui.FieldType.TEXT,
					label: ' '
				}).updateDisplayType({
					displayType: ui.FieldDisplayType.HIDDEN
				}).defaultValue = zee;



				var inlineHtml = '<script src="https://ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js"></script><script src="//code.jquery.com/jquery-1.11.0.min.js"></script><link rel="stylesheet" type="text/css" href="https://cdn.datatables.net/1.10.16/css/jquery.dataTables.css"><script type="text/javascript" charset="utf8" src="https://cdn.datatables.net/1.10.16/js/jquery.dataTables.js"></script><link href="//netdna.bootstrapcdn.com/bootstrap/3.3.2/css/bootstrap.min.css" rel="stylesheet"><script src="//netdna.bootstrapcdn.com/bootstrap/3.3.2/js/bootstrap.min.js"></script><link rel="stylesheet" href="https://1048144.app.netsuite.com/core/media/media.nl?id=2060796&c=1048144&h=9ee6accfd476c9cae718&_xt=.css"/><script src="https://1048144.app.netsuite.com/core/media/media.nl?id=2060797&c=1048144&h=ef2cda20731d146b5e98&_xt=.js"></script><link type="text/css" rel="stylesheet" href="https://1048144.app.netsuite.com/core/media/media.nl?id=2090583&c=1048144&h=a0ef6ac4e28f91203dfe&_xt=.css"><link href="https://cdnjs.cloudflare.com/ajax/libs/summernote/0.8.9/summernote.css" rel="stylesheet"><script src="https://cdnjs.cloudflare.com/ajax/libs/summernote/0.8.9/summernote.js"></script><script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/1.3.5/jspdf.debug.js" integrity="sha384-CchuzHs077vGtfhGYl9Qtc7Vx64rXBXdIAZIPbItbNyWIRTdG0oYAqki3Ry13Yzu" crossorigin="anonymous"></script><style>.mandatory{color:red;}</style>';

				inlineHtml += '<div class="container" style="padding-top: 3%;"><div id="alert" class="alert alert-danger fade in"></div>';

				var searchZees = search.load({
					id: 'customsearch_salesp_franchisee'
				});

				var resultSetZees = searchZees.run();

				inlineHtml += '<input id="customer_id" class="form-control" required value="' + customer_id + '" type="hidden"/></div></div>';

				inlineHtml += '<input id="zee_id" class="form-control" required value="' + zee + '" type="hidden"/></div></div>';
				inlineHtml += '<input id="script_id" class="form-control" required value="' + script_id + '" type="hidden"/></div></div>';
				inlineHtml += '<input id="deploy_id" class="form-control" required value="' + deploy_id + '" type="hidden"/></div></div>';
				// inlineHtml += '<input id="type" class="form-control" required value="' + type + '" type="hidden"/></div></div>';


				var resultSetContacts = null;
				var resultSetAddresses = null;


				var searched_addresses = search.load({
					id: 'customsearch_salesp_address'
				});


				searched_addresses.filters.push(search.createFilter({
					name: 'internalid',
					operator: search.Operator.IS,
					values: customer_id
				}));

				resultSetAddresses = searched_addresses.run();

				var searched_contacts = search.load({
					id: 'customsearch_salesp_contacts'
				});


				searched_contacts.filters.push(search.createFilter({
					name: 'company',
					operator: search.Operator.IS,
					values: customer_id
				}));

				resultSetContacts = searched_contacts.run();



				//Customer Details
				// inlineHtml += customerDetailsSection(entityid, companyName, abn, resultSetZees, zee, accounts_email, daytodayphone, daytodayemail, accounts_phone, customer_status, lead_source, customer_industry, lead_source_text);

				inlineHtml += cancellationNotes();

				inlineHtml += '<div class="tabs" style="font-size: xx-small;"><ul class="nav nav-tabs nav-justified" style="padding-top: 3%;">';

				var tab_content = '';

				inlineHtml += '<li role="presentation" class="active"><a href="#notes">USER NOTES</a></li>';
				inlineHtml += '</ul>';



				tab_content += '<div role="tabpanel" class="tab-pane active" id="notes">';
				//User Notes
				tab_content += userNote(savedNoteSearch);
				tab_content += '</div>';

				inlineHtml += '<div class="tab-content" style="padding-top: 3%;">';

				inlineHtml += tab_content;

				inlineHtml += '</div></div>';


				var htmlInstruct = form.addField({
					id: 'custpage_p1',
					type: ui.FieldType.INLINEHTML,
					label: ' '
				}).updateLayoutType({
					layoutType: ui.FieldLayoutType.OUTSIDEABOVE
				}).updateBreakType({
					breakType: ui.FieldBreakType.STARTROW
				}).defaultValue = inlineHtml;

				// var htmlInstruct = form.addSubmitButton({
				// 	label: 'Save'
				// });

				form.clientScriptFileId = 2240633;

				context.response.writePage(form);
			} else {
				redirect.toSuitelet({
					scriptId: 750,
					deploymentId: 1,
					parameters: {
						'type': 'create'
					}
				});
			}
		}

		function customerDetailsSection(entityid, companyName, abn, resultSetZees, zee, accounts_email, daytodayphone, daytodayemail, accounts_phone, customer_status, lead_source, customer_industry, lead_source_text) {
			var inlineQty = '<div class="form-group container company_name_section">';
			inlineQty += '<div class="row">';
			inlineQty += '<div class="col-xs-12 heading1"><h4><span class="label label-default col-xs-12">CUSTOMER DETAILS</span></h4></div>';
			inlineQty += '</div>';
			inlineQty += '</div>';

			if (!isNullorEmpty(entityid)) {
				inlineQty += '<div class="form-group container entityid_section">';
				inlineQty += '<div class="row">';
				inlineQty += '<div class="col-xs-6 entityid"><div class="input-group"><span class="input-group-addon" id="entityid_text">ID </span><input id="entityid" class="form-control entityid" readonly value="' + entityid + '" data-oldvalue="' + entityid + '" /></div></div>';
				inlineQty += '</div>';
				inlineQty += '</div>';
			}

			inlineQty += '<div class="form-group container company_name_section">';
			inlineQty += '<div class="row">';
			inlineQty += '<div class="col-xs-6 company_name"><div class="input-group"><span class="input-group-addon" id="company_name_text">NAME <span class="mandatory">*</span></span><input id="company_name" class="form-control company_name" required value="' + companyName + '" readonly data-oldvalue="' + companyName + '" /></div></div>';
			inlineQty += '<div class="col-xs-6 industry"><div class="input-group"><span class="input-group-addon" id="industry_text">INDUSTRY </span><select id="industry" class="form-control industry" readonly><option></option>';

			var industry_search = search.create({
				type: 'customlist_industry_category',
				columns: [{
					name: 'name'
				}, {
					name: 'internalId'
				}]
			});

			industry_search.run().each(function (searchResult) {

				var listValue = searchResult.getValue('name');
				var listID = searchResult.getValue('internalId');
				if (!isNullorEmpty(customer_industry)) {
					if (customer_industry == listID) {
						inlineQty += '<option value="' + listID + '" selected>' + listValue + '</option>';
					}
				}
				inlineQty += '<option value="' + listID + '">' + listValue + '</option>';

				return true;
			});
			inlineQty += '</select></div></div>';
			inlineQty += '</div>';
			inlineQty += '</div>';

			inlineQty += '<div class="form-group container abn_section">';
			inlineQty += '<div class="row">';
			inlineQty += '<div class="col-xs-6 abn"><div class="input-group"><span class="input-group-addon" id="abn_text">ABN </span><input id="abn" class="form-control abn" value="' + abn + '" readonly data-oldvalue="' + abn + '"/></div></div>';
			if (isNullorEmpty(customer_status)) {
				customer_status = 'SUSPECT - New'
			}
			inlineQty += '<div class="col-xs-6 status"><div class="input-group"><span class="input-group-addon" id="status_text">STATUS </span><input id="status" class="form-control status" readonly value="' + customer_status + '" data-oldvalue="' + customer_status + '" /></div></div>';
			inlineQty += '</div>';
			inlineQty += '</div>';

			inlineQty += '<div class="form-group container zee_section">';
			inlineQty += '<div class="row">';
			inlineQty += '<div class="col-xs-6 zee"><div class="input-group"><span class="input-group-addon" id="zee_text">FRANCHISEE <span class="mandatory">*</span></span><select id="zee" class="form-control zee" readonly><option value=0></option>';
			resultSetZees.each(function (searchResultZees) {

				zeeId = searchResultZees.getValue('internalid');
				zeeName = searchResultZees.getValue('companyname');

				if (zeeId == zee) {
					inlineQty += '<option value="' + zeeId + '" selected>' + zeeName + '</option>';
				} else {
					inlineQty += '<option value="' + zeeId + '">' + zeeName + '</option>';
				}

				return true;
			});

			inlineQty += '</select></div></div>';
			inlineQty += '<div class="col-xs-6 leadsource_div"><div class="input-group"><span class="input-group-addon" id="leadsource_text">LEAD SOURCE <span class="mandatory">*</span></span><select id="leadsource" class="form-control leadsource" readonly><option></option>';

			// var campaignSearch = search.create({
			// 	type: search.Type.CAMPAIGN,
			// 	title: 'LEAD SOURCE',
			// 	id: 'customsearch_lead_source',
			// 	columns: [{
			// 		name: 'internalId'
			// 	}, {
			// 		name: 'title'
			// 	}]
			// });

			// campaignSearch.save();
			// var campaignSearch = search.load({
			// 	id: 'customsearch_lead_source'
			// });
			// campaignSearch.run().each(function(searchResult) {

			// 	var listValue = searchResult.getValue('title');
			// 	// var listID = searchResult.getValue('internalId');
			// 	inlineQty += '<option value="">' + listValue + '</option>';
			// 	return true;
			// });
			if (lead_source == 97943) {
				inlineQty += '<option value="97943" selected>HO Generated</option>';
			} else {
				inlineQty += '<option value="97943">HO Generated</option>';
			}
			if (lead_source == 17) {
				inlineQty += '<option value="17" selected>Inbound - Call</option>';
			} else {
				inlineQty += '<option value="17">Inbound - Call</option>';
			}

			if (lead_source == 99417) {
				inlineQty += '<option value="99417" selected>Inbound - Web</option>';
			} else {
				inlineQty += '<option value="99417">Inbound - Web</option>';
			}

			if (lead_source == -4) {
				inlineQty += '<option value="-4" selected>Franchisee Generated</option>';
			} else {
				inlineQty += '<option value="-4" >Franchisee Generated</option>';
			}

			if (lead_source == 226139) {
				inlineQty += '<option value="226139" selected>SRA Field Sales</option>';
			} else {
				inlineQty += '<option value="226139">SRA Field Sales</option>';
			}

			inlineQty += '</select></div></div>';
			inlineQty += '</div>';
			inlineQty += '</div>';

			inlineQty += '<div class="form-group container email_section">';
			inlineQty += '<div class="row">';
			inlineQty += '<div class="col-xs-6 account_email_div"><div class="input-group"><span class="input-group-addon" id="account_email_text">ACCOUNTS (MAIN) EMAIL</span><input id="account_email" type="email" class="form-control account_email" data-oldvalue="' + accounts_email + '" value="' + accounts_email + '" /></div></div>';
			inlineQty += '<div class="col-xs-6 daytodayemail_div"><div class="input-group"><span class="input-group-addon" id="daytodayemail_text">DAY-TO-DAY EMAIL</span><input id="daytodayemail" type="email" class="form-control daytodayemail" data-oldvalue="' + daytodayemail + '" value="' + daytodayemail + '" /></div></div>';
			inlineQty += '</div>';
			inlineQty += '</div>';


			inlineQty += '<div class="form-group container phone_section">';
			inlineQty += '<div class="row">';
			inlineQty += '<div class="col-xs-6 account_phone_div"><div class="input-group"><span class="input-group-addon" id="account_phone_text">ACCOUNTS (MAIN) PHONE</span><input id="account_phone" class="form-control account_phone" data-oldvalue="' + accounts_phone + '" value="' + accounts_phone + '" /> <div class="input-group-btn"><button type="button" class="btn btn-success" id="call_accounts_phone"><span class="glyphicon glyphicon-earphone"></span></button></div></div></div>';
			inlineQty += '<div class="col-xs-6 daytodayphone_div"><div class="input-group"><span class="input-group-addon" id="daytodayphone_text">DAY-TO-DAY PHONE <span class="mandatory">*</span></span><input id="daytodayphone" class="form-control daytodayphone" data-oldvalue="' + daytodayphone + '" value="' + daytodayphone + '" /><div class="input-group-btn"><button type="button" class="btn btn-success" id="call_daytoday_phone"><span class="glyphicon glyphicon-earphone"></span></button></div></div></div>';
			inlineQty += '</div>';
			inlineQty += '</div>';

			return inlineQty;

		}

		function cancellationNotes() {


			var inlineQty = '<div class="form-group container company_name_section">';
			inlineQty += '<div class="row">';
			inlineQty += '<div class="col-xs-12 heading1"><h4><span class="label label-default col-xs-12">CANCELLATION DETAILS</span></h4></div>';
			inlineQty += '</div>';
			inlineQty += '</div>';

			inlineQty += '<div class="form-group container cancel_date">';
			inlineQty += '<div class="row">';
			inlineQty += '<div class="col-xs-6 cancel_date"><div class="input-group"><span class="input-group-addon" id="cancel_date_text">SERVICE CANCELLATION DATE</span><input id="cancel_date" type="date" class="form-control cancel_date" value="" data-oldvalue="" /></div></div>';
			inlineQty += '</div>';
			inlineQty += '</div>';

			inlineQty += '<div class="form-group container cancel_reason">';
			inlineQty += '<div class="row">';
			inlineQty += '<div class="col-xs-6 cancel_reason"><div class="input-group"><span class="input-group-addon" id="cancel_reason_text">SERVICE CANCELATION REASON</span><select id="cancel_reason" class="form-control cancel_reason" ><option></option>';

			var industry_search = search.create({
				type: 'customlist58',
				columns: [{
					name: 'name'
				}, {
					name: 'internalId'
				}],
				filters: ['isinactive', 'is', 'false']
			});


			industry_search.run().each(function (searchResult) {

				var listValue = searchResult.getValue('name');
				var listID = searchResult.getValue('internalId');
				inlineQty += '<option value="' + listID + '">' + listValue + '</option>';

				return true;
			});
			inlineQty += '</select></div></div>';
			inlineQty += '</div>';
			inlineQty += '</div>';

			inlineQty += '<div class="form-group container cancel_notice">';
			inlineQty += '<div class="row">';
			inlineQty += '<div class="col-xs-6 cancel_notice"><div class="input-group"><span class="input-group-addon" id="cancel_notice_text">SERVICE CANCELATION NOTICE</span><select id="cancel_notice" class="form-control cancel_notice" ><option></option>';

			var industry_search = search.create({
				type: 'customlist_cancellation_notice',
				columns: [{
					name: 'name'
				}, {
					name: 'internalId'
				}],
				filters: ['isinactive', 'is', 'false']
			});

			industry_search.run().each(function (searchResult) {

				var listValue = searchResult.getValue('name');
				var listID = searchResult.getValue('internalId');
				inlineQty += '<option value="' + listID + '">' + listValue + '</option>';

				return true;
			});
			inlineQty += '</select></div></div>';
			inlineQty += '</div>';
			inlineQty += '</div>';

			inlineQty += '<div class="form-group container cancel_comp">';
			inlineQty += '<div class="row">';
			inlineQty += '<div class="col-xs-6 cancel_comp"><div class="input-group"><span class="input-group-addon" id="cancel_comp_text">SERVICE CANCELLATION COMPETITOR</span><select id="cancel_comp" class="form-control cancel_comp" ><option></option>';

			var industry_search = search.create({
				type: 'customlist33',
				columns: [{
					name: 'name'
				}, {
					name: 'internalId'
				}],
				filters: ['isinactive', 'is', 'false']
			});

			industry_search.run().each(function (searchResult) {

				var listValue = searchResult.getValue('name');
				var listID = searchResult.getValue('internalId');
				inlineQty += '<option value="' + listID + '">' + listValue + '</option>';

				return true;
			});
			inlineQty += '</select></div></div>';
			inlineQty += '</div>';
			inlineQty += '</div>';

			// inlineQty += '<div class="form-group container row_body">';
			// inlineQty += '<div class="row">'
			// inlineQty += '<div class="col-xs-12 body_section"><textarea id="email_body" name="editordata"></textarea></div></div>';
			// inlineQty += '</div>';
			// inlineQty += '</div>';

			return inlineQty;
		}


		function userNote(savedNoteSearch) {

			var inlineQty = '<div class="form-group container reviewaddress_section">';
			inlineQty += '<div class="row">';
			inlineQty += '<div class="col-xs-3 create_note"><input type="button" value="CREATE USER NOTE" class="form-control btn btn-primary" id="create_note" /></div>';

			inlineQty += '</div>';
			inlineQty += '</div>';

			if (!isNullorEmpty(savedNoteSearch)) {

				inlineQty += '<div class="form-group container contacts_section">';
				inlineQty += '<div class="row">';
				inlineQty += '<div class="col-xs-12 address_div">';
				inlineQty += '<table border="0" cellpadding="15" id="address" class="table table-responsive table-striped address tablesorter" cellspacing="0" style="width: 100%;"><thead style="color: white;background-color: #607799;"><tr><th style="vertical-align: middle;text-align: center;"><b>CREATED DATE</b></th><th style="vertical-align: middle;text-align: center;"><b>ORGANISER</b></th><th style="vertical-align: middle;text-align: center;"><b>MESSAGE</b></th></tr></thead><tbody>';

				savedNoteSearch.run().each(function (searchResult) {

					var note_date = searchResult.getValue({
						name: 'notedate'
					});

					var author = searchResult.getText({
						name: "author"
					});



					var message = searchResult.getValue({
						name: 'note'
					});

					inlineQty += '<tr><td>' + note_date + '</td><td>' + author + '</td><td>' + message + '</td></tr>';

					return true;
				});

				inlineQty += '</tbody></table>';
				inlineQty += '</div>';
				inlineQty += '</div>';
				inlineQty += '</div>';
			}

			return inlineQty;
		}
		/**
		 * Is Null or Empty.
		 * 
		 * @param {Object} strVal
		 */
		function isNullorEmpty(strVal) {
			return (strVal == null || strVal == '' || strVal == 'null' || strVal == undefined || strVal == 'undefined' || strVal == '- None -');
		}
		return {
			onRequest: onRequest
		};
	});