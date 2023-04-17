/**
 * @NApiVersion 2.0
 * @NScriptType Suitelet
 * Author:               Ankith Ravindran
 * Created on:           Fri Apr 14 2023
 * Modified on:          Fri Apr 14 2023 11:36:14
 * SuiteScript Version:  2.0
 * Description:          Page that lists customres that have requested cancellation 
 *
 * Copyright (c) 2023 MailPlus Pty. Ltd.
 */

define(['N/ui/serverWidget', 'N/email', 'N/runtime', 'N/search', 'N/record', 'N/https', 'N/log', 'N/redirect', 'N/url', 'N/format'],
    function (ui, email, runtime, search, record, https, log, redirect, url, format) {
        var role = 0;
        var userId = 0;
        var zee = 0;

        function onRequest(context) {
            var baseURL = 'https://system.na2.netsuite.com';
            if (runtime.EnvType == "SANDBOX") {
                baseURL = 'https://system.sandbox.netsuite.com';
            }
            userId = runtime.getCurrentUser().id;

            role = runtime.getCurrentUser().role;

            if (context.request.method === 'GET') {

                var start_date = context.request.parameters.start_date;
                var last_date = context.request.parameters.last_date;
                zee = context.request.parameters.zee;
                var paramUserId = context.request.parameters.user;

                log.debug({
                    title: 'userId',
                    details: userId
                });


                if (isNullorEmpty(start_date)) {
                    start_date = null;
                }

                if (isNullorEmpty(last_date)) {
                    last_date = null;
                }

                if (isNullorEmpty(userId)) {
                    userId = null;
                }

                if (isNullorEmpty(paramUserId)) {
                    paramUserId = null;
                } else {
                    userId = paramUserId;
                }

                var form = ui.createForm({
                    title: 'Cancellation Request - List'
                });


                var inlineHtml =
                    '<script src="https://ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js"></script><script src="//code.jquery.com/jquery-1.11.0.min.js"></script><link rel="stylesheet" type="text/css" href="https://cdn.datatables.net/1.10.16/css/jquery.dataTables.css"><script type="text/javascript" charset="utf8" src="https://cdn.datatables.net/1.10.16/js/jquery.dataTables.js"></script><link href="//netdna.bootstrapcdn.com/bootstrap/3.3.2/css/bootstrap.min.css" rel="stylesheet"><script src="//netdna.bootstrapcdn.com/bootstrap/3.3.2/js/bootstrap.min.js"></script><link rel="stylesheet" href="https://system.na2.netsuite.com/core/media/media.nl?id=2060796&c=1048144&h=9ee6accfd476c9cae718&_xt=.css"/><script src="https://system.na2.netsuite.com/core/media/media.nl?id=2060797&c=1048144&h=ef2cda20731d146b5e98&_xt=.js"></script><link type="text/css" rel="stylesheet" href="https://system.na2.netsuite.com/core/media/media.nl?id=2090583&c=1048144&h=a0ef6ac4e28f91203dfe&_xt=.css"><script src="https://cdn.datatables.net/searchpanes/1.2.1/js/dataTables.searchPanes.min.js"><script src="https://cdn.datatables.net/select/1.3.3/js/dataTables.select.min.js"></script><script src="https://code.highcharts.com/highcharts.js"></script><script src="https://code.highcharts.com/modules/data.js"></script><script src="https://code.highcharts.com/modules/exporting.js"></script><script src="https://code.highcharts.com/modules/accessibility.js"></script></script><script src="https://code.highcharts.com/highcharts.js"></script><script src="https://code.highcharts.com/modules/data.js"></script><script src="https://code.highcharts.com/modules/drilldown.js"></script><script src="https://code.highcharts.com/modules/exporting.js"></script><script src="https://code.highcharts.com/modules/export-data.js"></script><script src="https://code.highcharts.com/modules/accessibility.js"></script><style>.mandatory{color:red;} .body{background-color: #CFE0CE !important;} @-webkit-keyframes animatetop {from {top:-300px; opacity:0} to {top:0; opacity:1}}@keyframes animatetop {from {top:-300px; opacity:0}to {top:0; opacity:1}}</style>';

                form.addField({
                    id: 'custpage_table_csv',
                    type: ui.FieldType.TEXT,
                    label: 'Table CSV'
                }).updateDisplayType({
                    displayType: ui.FieldDisplayType.HIDDEN
                })

                form.addField({
                    id: 'custpage_customer_id',
                    type: ui.FieldType.TEXT,
                    label: 'Table CSV'
                }).updateDisplayType({
                    displayType: ui.FieldDisplayType.HIDDEN
                })

                form.addField({
                    id: 'custpage_sales_rep_id',
                    type: ui.FieldType.TEXT,
                    label: 'Table CSV'
                }).updateDisplayType({
                    displayType: ui.FieldDisplayType.HIDDEN
                }).defaultValue = paramUserId;

                form.addField({
                    id: 'custpage_contact_id',
                    type: ui.FieldType.TEXT,
                    label: 'Table CSV'
                }).updateDisplayType({
                    displayType: ui.FieldDisplayType.HIDDEN
                })

                form.addField({
                    id: 'custpage_contact_email',
                    type: ui.FieldType.TEXT,
                    label: 'Table CSV'
                }).updateDisplayType({
                    displayType: ui.FieldDisplayType.HIDDEN
                })

                form.addField({
                    id: 'custpage_salesrecordid',
                    type: ui.FieldType.TEXT,
                    label: 'Table CSV'
                }).updateDisplayType({
                    displayType: ui.FieldDisplayType.HIDDEN
                })

                form.addField({
                    id: 'custpage_lostnoresponse',
                    type: ui.FieldType.TEXT,
                    label: 'Table CSV'
                }).updateDisplayType({
                    displayType: ui.FieldDisplayType.HIDDEN
                })

                //Loading Section that gets displayed when the page is being loaded
                inlineHtml += loadingSection();
 
                inlineHtml += '<div class="container" style="background-color: lightblue;font-size: 14px;"><p><b><u>Action Buttons</u></b><ol><li><b style="color: #5cb85c;">SAVE</b>: Click button to process new quote.</li><li><b style="color: #d9534f;">NOTIFY</b>: Click button to notify the IT Team to process the cancellation.</li></ol></p></div></br>'

                inlineHtml += '<div id="container">'

                inlineHtml += dataTable('cancel_list');
                inlineHtml += '</div>';

                form.addField({
                    id: 'preview_table',
                    label: 'inlinehtml',
                    type: 'inlinehtml'
                }).updateLayoutType({
                    layoutType: ui.FieldLayoutType.STARTROW
                }).defaultValue = inlineHtml;

                form.clientScriptFileId = 6324639;

                context.response.writePage(form);
            } else {
            }
        }

        /**
         * The table that will display the differents invoices linked to the
         * franchisee and the time period.
         *
         * @return {String} inlineHtml
         */
        function dataTable(name) {
            var inlineHtml = '<style>table#mpexusage-' +
                name +
                ' {color: #103D39 !important; font-size: 12px;text-align: center;border: none;}.dataTables_wrapper {font-size: 14px;}table#mpexusage-' +
                name +
                ' th{text-align: center;vertical-align: middle;} .bolded{font-weight: bold;}</style>';
            inlineHtml += '<table id="mpexusage-' +
                name +
                '" class="table table-responsive table-striped customer tablesorter cell-border compact" style="width: 100%;">';
            inlineHtml += '<thead style="color: white;background-color: #095C7B;">';
            inlineHtml += '<tr class="text-center">';

            inlineHtml += '</tr>';
            inlineHtml += '</thead>';

            inlineHtml += '<tbody id="result_usage_' + name + '" ></tbody>';

            inlineHtml += '</table>';
            return inlineHtml;
        }
        /**
         * The header showing that the results are loading.
         * @returns {String} `inlineQty`
         */
        function loadingSection() {
            var inlineHtml =
                '<div id="loading_section" class="form-group container loading_section " style="text-align:center">';
            inlineHtml += '<div class="row">';
            inlineHtml += '<div class="col-xs-12 loading_div">';
            inlineHtml += '<h1>Loading...</h1>';
            inlineHtml += '</div></div></div>';

            return inlineHtml;
        }

        /**
         * Used to pass the values of `date_from` and `date_to` between the scripts and to Netsuite for the records and the search.
         * @param   {String} date_iso       "2020-06-01"
         * @returns {String} date_netsuite  "1/6/2020"
         */
        function dateISOToNetsuite(date_iso) {
            var date_netsuite = '';
            if (!isNullorEmpty(date_iso)) {
                var date_utc = new Date(date_iso);
                // var date_netsuite = nlapiDateToString(date_utc);
                var date_netsuite = format.format({
                    value: date_utc,
                    type: format.Type.DATE
                });
            }
            return date_netsuite;
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
