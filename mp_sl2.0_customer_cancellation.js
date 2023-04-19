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


define(['N/ui/serverWidget', 'N/runtime', 'N/search', 'N/record', 'N/log', 'N/redirect', 'N/error', 'N/currentRecord', 'N/file', 'N/http', 'N/email', 'N/format'],
    function (ui, runtime, search, record, log, redirect, error, currentRecord, file, http, email, format) {
        var zee = 0;
        var role = 0;

        var baseURL = 'https://1048144.app.netsuite.com';
        if (runtime.EnvType == "SANDBOX") {
            baseURL = 'https://1048144-sb3.app.netsuite.com';
        }

        role = runtime.getCurrentUser().role;

        if (role == 1000) {
            zee = runtime.getCurrentUser().id;
        } else if (role == 3) { //Administrator
            zee = 6; //test
        } else if (role == 1032) { // System Support
            zee = 425904; //test-AR
        }

        function onRequest(context) {
            var type = 'create';

            if (context.request.method === 'GET') {
                var customer_id = null;
                var customer_record;
                var entityid;
                var companyName = '';

                type = context.request.parameters.type;
                customer_id = context.request.parameters.custid;


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

                zee = customer_record.getValue({
                    fieldId: 'partner'
                });

                var form = ui.createForm({
                    title: 'Customer Cancellation: <a href="' + baseURL + '/app/common/entity/custjob.nl?id=' + customer_id + '">' + entityid + '</a> ' + companyName
                });

                if (!isNullorEmpty(zee)) {
                    var zeeRecord = record.load({
                        type: record.Type.PARTNER,
                        id: zee,
                        isDynamic: true
                    });
                    var franchisee_name = zeeRecord.getValue({
                        fieldId: 'companyname'
                    });

                    zee_main_contact_name = zeeRecord.getValue({
                        fieldId: 'custentity3'
                    });
                    zee_email = zeeRecord.getValue({
                        fieldId: 'email'
                    });
                    zee_main_contact_phone = zeeRecord.getValue({
                        fieldId: 'custentity2'
                    });
                    zee_abn = zeeRecord.getValue({
                        fieldId: 'custentity_abn_franchiserecord'
                    });
                }
                //Customer Status
                customer_status_id = customer_record.getValue({
                    fieldId: 'entitystatus'
                });


                // Customer Franchisee Text
                zeeText = customer_record.getText({
                    fieldId: 'partner'
                });


                /**
                 * Description - To add all the API's to the begining of the page
                 */

                var inlineHtml =
                    '<script src="https://ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js"><script src="//code.jquery.com/jquery-1.11.0.min.js"></script><link type="text/css" rel="stylesheet" href="https://cdn.datatables.net/1.10.13/css/jquery.dataTables.min.css"><link href="//netdna.bootstrapcdn.com/bootstrap/3.3.2/css/bootstrap.min.css" rel="stylesheet"><script src="//netdna.bootstrapcdn.com/bootstrap/3.3.2/js/bootstrap.min.js"></script><link rel="stylesheet" href="https://1048144.app.netsuite.com/core/media/media.nl?id=2060796&c=1048144&h=9ee6accfd476c9cae718&_xt=.css"/><script src="https://1048144.app.netsuite.com/core/media/media.nl?id=2060797&c=1048144&h=ef2cda20731d146b5e98&_xt=.js"></script><link type="text/css" rel="stylesheet" href="https://1048144.app.netsuite.com/core/media/media.nl?id=2090583&c=1048144&h=a0ef6ac4e28f91203dfe&_xt=.css">';
                inlineHtml +=
                    '<div class="container" style="padding-top: 3%;"><div id="alert" class="alert alert-danger fade in"></div></div>';

                // Load DataTables
                inlineHtml +=
                    '<link rel="stylesheet" type="text/css" href="//cdn.datatables.net/1.10.21/css/jquery.dataTables.min.css">';
                inlineHtml +=
                    '<script type="text/javascript" charset="utf8" src="//cdn.datatables.net/1.10.21/js/jquery.dataTables.min.js"></script>';


                form.addField({
                    id: 'upload_file_1',
                    label: 'SERVICE CANCELLATION PROOF - PDF FILE ONLY',
                    type: ui.FieldType.FILE
                }).updateLayoutType({
                    layoutType: ui.FieldLayoutType.OUTSIDEBELOW
                }).isMandatory = true;

                inlineHtml +=
                    '<div class="form-group container open_invoices requester_header">';
                inlineHtml += '<div class="row">';
                inlineHtml += '<div class="col-xs-12 heading2">';
                inlineHtml +=
                    '<h4><span class="label label-default col-xs-12" style="background-color: #095c7b;">SERVICE CANCELLATION DETAILS</span></h4>';
                inlineHtml += '</div>';
                inlineHtml += '</div>';
                inlineHtml += '</div>';


                inlineHtml += '<div class="form-group container date_effective_section">';
                inlineHtml += '<div class="row">';

                inlineHtml += '<div class="col-xs-12 "><div class="input-group"><span class="input-group-addon">DATE EFFECTIVE <span class="mandatory" style="color:red">*</span></span><input type="date" id="date_effective" value="" class="form-control date_effective"/></div></div>';

                inlineHtml += '</div>';
                inlineHtml += '</div>';

                inlineHtml += '</select></div></div>';
                inlineHtml += '</div>';
                inlineHtml += '</div>';

                inlineHtml += '<div class="form-group container cancel_reason_div ">';
                inlineHtml += '<div class="row">';
                inlineHtml += '<div class="col-xs-4 cancel_reason"><div class="input-group"><span class="input-group-addon" id="cancel_reason_text">CANCELATION REASON <span class="mandatory" style="color:red">*</span></span><select id="cancel_reason" class="form-control cancel_reason" ><option></option>';

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
                    inlineHtml += '<option value="' + listID + '">' + listValue + '</option>';

                    return true;
                });
                inlineHtml += '</select></div></div>';

                inlineHtml += '<div class="col-xs-4 cancel_notice"><div class="input-group"><span class="input-group-addon" id="cancel_notice_text">CANCELATION NOTICE <span class="mandatory" style="color:red">*</span></span><select id="cancel_notice" class="form-control cancel_notice" ><option></option>';

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
                    inlineHtml += '<option value="' + listID + '">' + listValue + '</option>';

                    return true;
                });
                inlineHtml += '</select></div></div>';

                inlineHtml += '<div class="col-xs-4 cancel_comp"><div class="input-group"><span class="input-group-addon" id="cancel_comp_text">CANCELLATION COMPETITOR</span><select id="cancel_comp" class="form-control cancel_comp" ><option></option>';

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
                    inlineHtml += '<option value="' + listID + '">' + listValue + '</option>';

                    return true;
                });
                inlineHtml += '</select></div></div>';
                inlineHtml += '</div>';
                inlineHtml += '</div>';

                inlineHtml += '<div class="form-group container note_section">';
                inlineHtml += '<div class="row">';
                inlineHtml += '<div class="col-xs-12 note"><div class="input-group"><span class="input-group-addon" id="note_text">NOTE </span><textarea id="note" class="form-control note" rows="4" cols="50"  /></textarea></div></div>';
                inlineHtml += '</div>';
                inlineHtml += '</div>';


                inlineHtml += '</div>';
                inlineHtml += '</div>';

                // inlineHtml += openInvoicesSection();

                form.addField({
                    id: 'custpage_customer_id',
                    type: ui.FieldType.TEXT,
                    label: 'Customer ID'
                }).updateDisplayType({
                    displayType: ui.FieldDisplayType.HIDDEN
                }).defaultValue = parseInt(customer_id);


                form.addField({
                    id: 'custpage_customer_entityid',
                    type: ui.FieldType.TEXT,
                    label: 'Customer ID'
                }).updateDisplayType({
                    displayType: ui.FieldDisplayType.HIDDEN
                }).defaultValue = entityid;

                form.addField({
                    id: 'custpage_customer_franchisee',
                    type: ui.FieldType.TEXT,
                    label: 'Franchisee ID'
                }).updateDisplayType({
                    displayType: ui.FieldDisplayType.HIDDEN
                }).defaultValue = zee;

                form.addField({
                    id: 'custpage_note',
                    type: ui.FieldType.TEXT,
                    label: 'Note'
                }).updateDisplayType({
                    displayType: ui.FieldDisplayType.HIDDEN
                })

                form.addField({
                    id: 'custpage_email_body',
                    type: ui.FieldType.TEXT,
                    label: 'Email Body'
                }).updateDisplayType({
                    displayType: ui.FieldDisplayType.HIDDEN
                })


                form.addField({
                    id: 'custpage_email_subject',
                    type: ui.FieldType.TEXT,
                    label: 'Email Body'
                }).updateDisplayType({
                    displayType: ui.FieldDisplayType.HIDDEN
                })

                form.addField({
                    id: 'custpage_sale_type',
                    type: ui.FieldType.TEXT,
                    label: 'Email Body'
                }).updateDisplayType({
                    displayType: ui.FieldDisplayType.HIDDEN
                })

                form.addField({
                    id: 'custpage_send_to',
                    type: ui.FieldType.TEXT,
                    label: 'Email Body'
                }).updateDisplayType({
                    displayType: ui.FieldDisplayType.HIDDEN
                })

                form.addSubmitButton({
                    label: 'Submit'
                });

                form.addField({
                    id: 'preview_table',
                    label: 'inlinehtml',
                    type: 'inlinehtml'
                }).updateLayoutType({
                    layoutType: ui.FieldLayoutType.STARTROW
                }).defaultValue = inlineHtml;

                form.addResetButton({
                    id: 'reset',
                    label: 'Reset',
                    functionName: 'onclick_reset()'
                });

                form.addButton({
                    id: 'back',
                    label: 'Back',
                    functionName: 'onclick_back()'
                });

                form.clientScriptFileId = 6332354;

                context.response.writePage(form);
            } else {
                var customerId = context.request.parameters.custpage_customer_id;
                var fileObj = context.request.files.upload_file_1;
                var note = context.request.parameters.custpage_note;

                log.debug({
                    title: 'customerId',
                    details: customerId
                });
                

                var proofid = null;

                if (!isNullorEmpty(fileObj)) {
                    fileObj.folder = 3630868;
                    var file_type = fileObj.fileType;
                    if (file_type == 'PDF') {
                        file_type == 'pdf';
                        var file_name = getDatePDF() + '_' + parseInt(customerId) + '.' + file_type;
                        var file_name = getDatePDF() + '_service_change_notification_' + parseInt(customerId) + '.' + file_type;
                    }
                    fileObj.name = file_name;

                    if (file_type == 'PDF') {
                        // Create file and upload it to the file cabinet.
                        proofid = fileObj.save();
                    } else {
                        error.create({
                            message: 'Must be in PDF format',
                            name: 'PDF_ERROR',
                            notifyOff: true
                        });
                    }

                }

                var customer_record = record.load({
                    type: record.Type.CUSTOMER,
                    id: parseInt(customerId),
                    isDynamic: true
                });

                if (!isNullorEmpty(proofid)) {
                    customer_record.setValue({
                        fieldId: 'custentity_cancel_proof',
                        value: proofid
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

                context.response.sendRedirect({
                    type: http.RedirectType.RECORD,
                    identifier: record.Type.CUSTOMER,
                    id: parseInt(customerId)
                });

            }
        }

        /**
         * A Datatable displaying the open invoices of the customer
         * @param   {Number}    ticket_id
         * @param   {String}    selector_type
         * @return  {String}    inlineHtml
         */
        function openInvoicesSection() {

            var hide_class_section = '';
            // Open invoices header
            var inlineHtml =
                '<div class="form-group container open_invoices open_invoices_header ' +
                hide_class_section + '">';
            inlineHtml += '<div class="row">';
            inlineHtml += '<div class="col-xs-12 heading2">';
            inlineHtml +=
                '<h4><span class="label label-default col-xs-12" style="background-color: #095c7b;">OPEN INVOICES</span></h4>';
            inlineHtml += '</div></div></div>';

            // Open invoices dropdown field
            inlineHtml +=
                '<div class="form-group container open_invoices invoices_dropdown ' +
                hide_class_section + '">';
            inlineHtml += '<div class="row">';
            inlineHtml += '<div class="col-xs-12 invoices_dropdown_div">';
            inlineHtml += '<div class="input-group">';
            inlineHtml +=
                '<span class="input-group-addon" id="invoices_dropdown_text">INVOICE STATUS</span>';
            inlineHtml += '<select id="invoices_dropdown" class="form-control">';
            inlineHtml += '<option value="open" selected>Open</option>';
            inlineHtml +=
                '<option value="paidInFull">Paid In Full (last 3 months)</option>';
            inlineHtml += '</select>';
            inlineHtml += '</div></div></div></div>';

            // Open Invoices Datatable
            inlineHtml +=
                '<div class="form-group container open_invoices open_invoices_table ' +
                hide_class_section + '">';
            inlineHtml += '<div class="row">';
            inlineHtml += '<div class="col-xs-12" id="open_invoice_dt_div">';
            // It is inserted as inline html in the script mp_cl_open_ticket
            inlineHtml += '</div></div></div>';

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
                timezone: format.Timezone.AUSTRALIA_SYDNEY
            })

            return date;
        }

        function getDatePDF() {
            var date = (new Date());
            // if (date.getHours() > 6) {
            //     date = nlapiAddDays(date, 1);

            // }
            // date.setHours(date.getHours() + 17);
            var date_string = date.getFullYear() + '' + (date.getMonth() + 1) + '' + date.getDate() + '_' + date.getHours() + '' + date.getMinutes();

            return date_string;
        }

        function pad(s) {
            return (s < 10) ? '0' + s : s;
        }

        function GetFormattedDate(stringDate) {

            var todayDate = nlapiStringToDate(stringDate);
            var month = pad(todayDate.getMonth() + 1);
            var day = pad(todayDate.getDate());
            var year = (todayDate.getFullYear());
            return year + "-" + month + "-" + day;
        }

        function isNullorEmpty(val) {
            if (val == '' || val == null) {
                return true;
            } else {
                return false;
            }
        }

        return {
            onRequest: onRequest
        };

    });