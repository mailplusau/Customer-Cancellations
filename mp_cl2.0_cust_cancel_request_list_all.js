/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * Author:               Ankith Ravindran
 * Created on:           Fri Apr 11 2023
 * Modified on:          Fri Apr 14 2023 11:39:43
 * SuiteScript Version:  2.0 
 * Description:          Client script for the Page that lists customres that have requested cancellation  
 *
 * Copyright (c) 2023 MailPlus Pty. Ltd.
 */


define(['N/email', 'N/runtime', 'N/search', 'N/record', 'N/http', 'N/log',
    'N/error', 'N/url', 'N/format', 'N/currentRecord'
],
    function (email, runtime, search, record, http, log, error, url, format,
        currentRecord) {
        var zee = 0;
        var userId = 0;
        var role = 0;

        var baseURL = 'https://1048144.app.netsuite.com';
        if (runtime.EnvType == "SANDBOX") {
            baseURL = 'https://1048144-sb3.app.netsuite.com';
        }

        role = runtime.getCurrentUser().role;
        var userName = runtime.getCurrentUser().name;
        var userId = runtime.getCurrentUser().id;
        var currRec = currentRecord.get();

        var total_months = 14;

        var today = new Date();
        var today_day_in_month = today.getDate();
        var today_day_in_week = today.getDay();
        var today_month = today.getMonth() + 1;
        var today_year = today.getFullYear();

        if (today_day_in_month < 10) {
            today_day_in_month = '0' + today_day_in_month;
        }

        if (today_month < 10) {
            today_month = '0' + (today_month);
        }

        var todayString = today_day_in_month + '/' + today_month + '/' +
            today_year;

        var current_year_month = today_year + '-' + today_month;
        var difference_months = total_months - parseInt(today_month);

        var saleType = 0;


        function isWeekday(year, month, day) {
            var day = new Date(year, month, day).getDay();
            return day != 0 && day != 6;
        }

        function getWeekdaysInMonth(month, year) {
            var days = daysInMonth(month, year);
            var weekdays = 0;
            for (var i = 0; i < days; i++) {
                if (isWeekday(year, month, i + 1)) weekdays++;
            }
            return weekdays;
        }

        function daysInMonth(iMonth, iYear) {
            return 32 - new Date(iYear, iMonth, 32).getDate();
        }

        function pageLoad() {
            $('.range_filter_section').addClass('hide');
            $('.range_filter_section_top').addClass('hide');
            $('.date_filter_section').addClass('hide');
            $('.period_dropdown_section').addClass('hide');

            $('.loading_section').removeClass('hide');
        }


        function afterSubmit() {

            $('.loading_section').addClass('hide');

            $('.table_section').removeClass('hide');
            $('.cust_filter_section').removeClass('hide');
            $('.cust_dropdown_section').removeClass('hide');
            $('.service_change_type_section').removeClass('hide');
            $('.zee_available_buttons_section').removeClass('hide');
            $('.instruction_div').removeClass('hide');
        }

        var paramUserId = null;
        var paramSaleType = null;

        function pageInit() {

            $("#NS_MENU_ID0-item0").css("background-color", "#CFE0CE");
            $("#NS_MENU_ID0-item0 a").css("background-color", "#CFE0CE");
            $("#body").css("background-color", "#CFE0CE");

            var val1 = currentRecord.get();
            paramUserId = val1.getValue({
                fieldId: 'custpage_sales_rep_id'
            });
            paramSaleType = val1.getValue({
                fieldId: 'custpage_sale_type'
            });

            debtDataSet = [];
            debt_set = [];

            $("#applyFilter").click(function () {

                userId = $('#user_dropdown option:selected').val();
                saleType = $('#commencementtype option:selected').val();

                var url = baseURL + "/app/site/hosting/scriptlet.nl?script=1719&deploy=1&user=" + userId + '&saletype=' + saleType;

                window.location.href = url;
            });


            submitSearch();
            var dataTable = $('#mpexusage-cancel_list').DataTable();


            var today = new Date();
            var today_year = today.getFullYear();
            var today_month = today.getMonth();
            var today_day = today.getDate();

            /**
             *  Click for Instructions Section Collapse
             */
            $('.collapse').on('shown.bs.collapse', function () {
                $(".range_filter_section_top").css("padding-top", "500px");
            })
            $('.collapse').on('hide.bs.collapse', function () {
                $(".range_filter_section_top").css("padding-top", "0px");
            })

            $('.savecustomer').click(function () {

                var customerInternalId = $(this).attr("data-id");

                console.log('customerInternalId: ' + customerInternalId);

                //Sales Record - In Use
                var salesRecordsActiveSearch = search.load({
                    type: 'customrecord_sales',
                    id: 'customsearch_active_sales_record'
                });

                salesRecordsActiveSearch.filters.push(search.createFilter({
                    name: 'internalid',
                    join: 'custrecord_sales_customer',
                    operator: search.Operator.ANYOF,
                    values: customerInternalId
                }));


                var countSalesRecord = 0;

                salesRecordsActiveSearch.run().each(function (
                    salesRecordsActiveSearchResultSet) {

                    var salesRecordInternalId = salesRecordsActiveSearchResultSet.getValue({
                        name: 'internalid'
                    });

                    console.log('Updating Sales Record: ' + salesRecordInternalId);

                    var sales_record = record.load({
                        type: 'customrecord_sales',
                        id: salesRecordInternalId
                    });

                    sales_record.setValue({
                        fieldId: 'custrecord_sales_completed',
                        value: true
                    })

                    sales_record.save();

                    console.log('Sales Record: ' + salesRecordInternalId + ' updated');
                    countSalesRecord++;
                    return true;
                });

                console.log('Sales Records Updated: ' + countSalesRecord);

                var sales_record = record.create({
                    type: 'customrecord_sales'
                });

                sales_record.setValue({
                    fieldId: 'custrecord_sales_outcome',
                    value: 20
                })

                sales_record.setValue({
                    fieldId: 'custrecord_sales_campaign',
                    value: 68
                })

                sales_record.setValue({
                    fieldId: 'custrecord_sales_customer',
                    value: customerInternalId
                })

                sales_record.setValue({
                    fieldId: 'custrecord_sales_assigned',
                    value: runtime.getCurrentUser().id
                })

                sales_record.setValue({
                    fieldId: 'custrecord_sales_lastcalldate',
                    value: getDateStoreNS()
                })

                var newSalesRecord = sales_record.save();

                var customer_record = record.load({
                    type: record.Type.CUSTOMER,
                    id: parseInt(customerInternalId),
                    isDynamic: true
                });

                customer_record.setValue({
                    fieldId: 'custentity_cancel_ongoing',
                    value: 1
                });
                if (isNullorEmpty(customer_record.getValue({
                    fieldId: 'custentity_cancel_ongoing_start_date',
                    value: getDateStoreNS()
                }))) {
                    customer_record.setValue({
                        fieldId: 'custentity_cancel_ongoing_start_date',
                        value: getDateStoreNS()
                    });
                }

                customer_record.save();

                var convertLink = 'https://1048144.app.netsuite.com/app/site/hosting/scriptlet.nl?script=740&deploy=1&compid=1048144&callcenter=T&recid=' + parseInt(customerInternalId) + '&sales_record_id=' + newSalesRecord;
                window.location.href = convertLink;
            })

            $(".notifyitteam").click(function () {
                var customerInternalId = $(this).attr("data-id");

                var convertLink = 'https://1048144.app.netsuite.com/app/site/hosting/scriptlet.nl?script=1722&deploy=1&compid=1048144&custid=' + parseInt(customerInternalId);
                window.location.href = convertLink;

            });

            $(".viewcustomer").click(function () {
                var customerInternalId = $(this).attr("data-id");
                var salesRecordInternalId = $(this).attr("data-salesrecord");

                var convertLink = 'https://1048144.app.netsuite.com/app/site/hosting/scriptlet.nl?script=740&deploy=1&compid=1048144&callcenter=T&recid=' + parseInt(customerInternalId) + '&sales_record_id=' + salesRecordInternalId;
                window.location.href = convertLink;

            });

            //On click of close icon in the modal
            $('.close').click(function () {
                $("#myModal").hide();
            });

        }

        //Initialise the DataTable with headers.
        function submitSearch() {
            // duringSubmit();

            dataTable = $('#mpexusage-cancel_list').DataTable({
                destroy: true,
                data: debtDataSet,
                pageLength: 1000,
                order: [[5, 'des']],
                columns: [{
                    title: 'ACTIONS'
                }, {
                    title: 'ID'
                }, {
                    title: 'COMPANY NAME'
                }, {
                    title: 'FRANCHISEE'
                }, {
                    title: 'STATUS'
                }, {
                    title: 'REQUEST DATE'
                }, {
                    title: 'DATE EFFECT'
                }, {
                    title: 'REQUESTER NAME'
                }, {
                    title: 'REQUESTER PHONE'
                }, {
                    title: 'REQUESTER EMAIL'
                }, {
                    title: 'ON GOING'
                }],
                columnDefs: [{
                    targets: [2, 3, 4],
                    className: 'bolded'
                }, {
                    targets: [0, 2],
                    className: 'col-xs-2'
                }, {
                    targets: [3, 4],
                    className: 'col-xs-1'
                }],
                rowCallback: function (row, data, index) {
                    if (data[10] == 'Yes') {
                        $('td', row).css('background-color', '#DBE4C6');
                    }
                }
            });

            loadSearch();
            afterSubmit();
        }

        function loadSearch() {
            //Customer Cancellation - Requested List
            var custListCancellationRequestSearch = search.load({
                type: 'customer',
                id: 'customsearch_cust_cancellation_requested'
            });

            if (!isNullorEmpty(paramUserId)) {
                custListCancellationRequestSearch.filters.push(search.createFilter({
                    name: 'custentity_sales_rep_assigned',
                    join: 'partner',
                    operator: search.Operator.IS,
                    values: paramUserId
                }));
            }

            if (!isNullorEmpty(paramSaleType)) {
                custListCancellationRequestSearch.filters.push(search.createFilter({
                    name: 'custentity_cust_service_change_type',
                    join: null,
                    operator: search.Operator.IS,
                    values: paramSaleType
                }));
            }

            custListCancellationRequestSearch.run().each(function (
                custListCancellationRequestSearchResultSet) {

                var custInternalID = custListCancellationRequestSearchResultSet.getValue({
                    name: 'internalid'
                });
                var custEntityID = custListCancellationRequestSearchResultSet.getValue({
                    name: 'entityid'
                });
                var custName = custListCancellationRequestSearchResultSet.getValue({
                    name: 'companyname'
                });
                var zeeID = custListCancellationRequestSearchResultSet.getValue({
                    name: 'partner'
                });
                var zeeName = custListCancellationRequestSearchResultSet.getText({
                    name: 'partner'
                });

                var statusText = custListCancellationRequestSearchResultSet.getText({
                    name: 'entitystatus'
                });

                var serviceCancellationRequestedDate = custListCancellationRequestSearchResultSet.getValue({
                    name: "custentity_cancellation_requested_date"
                });

                var serviceCancellationDate = custListCancellationRequestSearchResultSet.getValue({
                    name: "custentity13"
                });
                var requesterName = custListCancellationRequestSearchResultSet.getValue({
                    name: "custentity_hc_mailcon_name"
                });
                var requesterPhone = custListCancellationRequestSearchResultSet.getValue({
                    name: "custentity_hc_mailcon_phone"
                });
                var requesterEmail = custListCancellationRequestSearchResultSet.getValue({
                    name: "custentity_hc_mailcon_email"
                });
                var cancelOngoingText = custListCancellationRequestSearchResultSet.getText({
                    name: "custentity_cancel_ongoing"
                });



                debt_set.push({
                    custInternalID: custInternalID,
                    custEntityID: custEntityID,
                    custName: custName,
                    zeeID: zeeID,
                    zeeName: zeeName,
                    statusText: statusText,
                    serviceCancellationRequestedDate: serviceCancellationRequestedDate,
                    serviceCancellationDate: serviceCancellationDate,
                    cancelOngoingText: cancelOngoingText,
                    requesterName: requesterName,
                    requesterPhone: requesterPhone,
                    requesterEmail: requesterEmail
                });

                return true;
            });

            console.log(debt_set)

            loadDatatable(debt_set);
            debt_set = [];

        }

        function loadDatatable(debt_rows) {

            debtDataSet = [];
            csvSet = [];


            if (!isNullorEmpty(debt_rows)) {
                debt_rows.forEach(function (debt_row, index) {

                    //Sales Record - In Use
                    var salesRecordsActiveSearch = search.load({
                        type: 'customrecord_sales',
                        id: 'customsearch_active_sales_record'
                    });

                    salesRecordsActiveSearch.filters.push(search.createFilter({
                        name: 'internalid',
                        join: 'custrecord_sales_customer',
                        operator: search.Operator.ANYOF,
                        values: debt_row.custInternalID
                    }));

                    var resultRange = salesRecordsActiveSearch.run().getRange({
                        start: 0,
                        end: 1
                    });

                    if (resultRange.length == 0) {
                        var linkURL =
                            '<input type="button" id="" data-id="' +
                            debt_row.custInternalID +
                            '" value="SAVE" class="form-control btn btn-xs btn-success savecustomer" style="font-weight: bold; cursor: pointer !important;width: fit-content;" />     <input type="button" id="" data-id="' +
                            debt_row.custInternalID +
                            '" value="CANCEL" class="form-control btn btn-xs btn-danger notifyitteam" style="font-weight: bold;cursor: pointer !important;width: fit-content;" />';
                    } else {
                        var salesRecordInternalId = null;
                        for (var i = 0; i < resultRange.length; i++) {
                            salesRecordInternalId = resultRange[i].getValue({
                                name: 'internalid'
                            });

                            var linkURL =
                                '<input type="button" id="" data-id="' +
                                debt_row.custInternalID +
                                '" data-salesrecord="' +
                                salesRecordInternalId +
                                '" value="VIEW" class="form-control btn btn-xs btn-primary viewcustomer" style="font-weight: bold; cursor: pointer !important;width: fit-content;" />     <input type="button" id="" data-id="' +
                                debt_row.custInternalID +
                                '" value="CANCEL" class="form-control btn btn-xs btn-danger notifyitteam" style="font-weight: bold;cursor: pointer !important;width: fit-content;" />';
                        }
                    }

                    var customerIDLink =
                        '<a href="https://1048144.app.netsuite.com/app/common/entity/custjob.nl?id=' +
                        debt_row.custInternalID + '&whence=" target="_blank"><b>' +
                        debt_row.custEntityID + '</b></a>';


                    var requestDateSplit = debt_row.serviceCancellationRequestedDate.split('/');

                    if (parseInt(requestDateSplit[1]) < 10) {
                        requestDateSplit[1] = '0' + requestDateSplit[1]
                    }

                    if (parseInt(requestDateSplit[0]) < 10) {
                        requestDateSplit[0] = '0' + requestDateSplit[0]
                    }

                    var requestDateString = requestDateSplit[2] + '-' + requestDateSplit[1] + '-' +
                        requestDateSplit[0];



                    var cancellationDateSplit = debt_row.serviceCancellationDate.split('/');

                    if (parseInt(cancellationDateSplit[1]) < 10) {
                        cancellationDateSplit[1] = '0' + cancellationDateSplit[1]
                    }

                    if (parseInt(cancellationDateSplit[0]) < 10) {
                        cancellationDateSplit[0] = '0' + cancellationDateSplit[0]
                    }

                    var cancellationDateString = cancellationDateSplit[2] + '-' + cancellationDateSplit[1] + '-' +
                        cancellationDateSplit[0];

                    debtDataSet.push([linkURL,
                        customerIDLink,
                        debt_row.custName, debt_row.zeeName, debt_row.statusText, requestDateString, cancellationDateString, debt_row.requesterName, debt_row.requesterPhone, debt_row.requesterEmail, debt_row.cancelOngoingText
                    ]);
                    csvSet.push([debt_row.custInternalID,
                    debt_row.custEntityID,
                    debt_row.custName, debt_row.zeeName, debt_row.statusText, requestDateString, cancellationDateString, debt_row.cancelOngoingText
                    ]);
                });
            }

            var datatable = $('#mpexusage-cancel_list').DataTable();
            datatable.clear();
            datatable.rows.add(debtDataSet);
            datatable.draw();

            saveCsv(csvSet);

            return true;
        }

        /**
         * Load the string stored in the hidden field 'custpage_table_csv'.
         * Converts it to a CSV file.
         * Creates a hidden link to download the file and triggers the click of the link.
         */
        function downloadCsv() {
            var today = new Date();
            today = formatDate(today);
            var val1 = currentRecord.get();
            var csv = val1.getValue({
                fieldId: 'custpage_table_csv',
            });
            today = replaceAll(today);
            var a = document.createElement("a");
            document.body.appendChild(a);
            a.style = "display: none";
            var content_type = 'text/csv';
            var csvFile = new Blob([csv], {
                type: content_type
            });
            var url = window.URL.createObjectURL(csvFile);
            var filename = 'Customer Cancellation List_' + today + '.csv';
            a.href = url;
            a.download = filename;
            a.click();
            window.URL.revokeObjectURL(url);


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


        function saveRecord() {

            return true;
        }

        /**
         * Create the CSV and store it in the hidden field 'custpage_table_csv' as a string.
         * @param {Array} ordersDataSet The `billsDataSet` created in `loadDatatable()`.
         */
        function saveCsv(ordersDataSet) {
            var sep = "sep=;";
            var headers = ["Customer Internal ID", "Customer Entity ID",
                "Customer Name",
                "Franchisee", "Status", "Cancellation Requested Date",
                "Cancellation Date", "Cancellation Progress"
            ]
            headers = headers.join(';'); // .join(', ')

            var csv = sep + "\n" + headers + "\n";


            ordersDataSet.forEach(function (row) {
                row = row.join(';');
                csv += row;
                csv += "\n";
            });

            var val1 = currentRecord.get();
            val1.setValue({
                fieldId: 'custpage_table_csv',
                value: csv
            });


            return true;
        }

        function formatDate(testDate) {
            console.log('testDate: ' + testDate);
            var responseDate = format.format({
                value: testDate,
                type: format.Type.DATE
            });
            console.log('responseDate: ' + responseDate);
            return responseDate;
        }

        function replaceAll(string) {
            return string.split("/").join("-");
        }

        function stateIDPublicHolidaysRecord(state) {
            switch (state) {
                case 1:
                    return 1; //NSW
                    break;
                case 2:
                    return 6; //QLD
                    break;
                case 3:
                    return 5; //VIC
                    break;
                case 4:
                    return 3; //SA
                    break;
                case 5:
                    return 7; //TAS
                    break;
                case 6:
                    return 4; //ACT
                    break;
                case 7:
                    return 2; //WA
                    break;
                case 8:
                    return 8; //NT
                    break;
                default:
                    return null;
                    break;
            }
        }

        function stateID(state) {
            state = state.toUpperCase();
            switch (state) {
                case 'ACT':
                    return 6
                    break;
                case 'NSW':
                    return 1
                    break;
                case 'NT':
                    return 8
                    break;
                case 'QLD':
                    return 2
                    break;
                case 'SA':
                    return 4
                    break;
                case 'TAS':
                    return 5
                    break;
                case 'VIC':
                    return 3
                    break;
                case 'WA':
                    return 7
                    break;
                default:
                    return 0;
                    break;
            }
        }
        /**
         * Sets the values of `date_from` and `date_to` based on the selected option in the '#period_dropdown'.
         */
        function selectDate() {
            var period_selected = $('#period_dropdown option:selected').val();
            var today = new Date();
            var today_day_in_month = today.getDate();
            var today_day_in_week = today.getDay();
            var today_month = today.getMonth();
            var today_year = today.getFullYear();

            var today_date = new Date(Date.UTC(today_year, today_month,
                today_day_in_month))

            switch (period_selected) {
                case "this_week":
                    // This method changes the variable "today" and sets it on the previous monday
                    if (today_day_in_week == 0) {
                        var monday = new Date(Date.UTC(today_year, today_month,
                            today_day_in_month - 6));
                    } else {
                        var monday = new Date(Date.UTC(today_year, today_month,
                            today_day_in_month - today_day_in_week + 1));
                    }
                    var date_from = monday.toISOString().split('T')[0];
                    var date_to = today_date.toISOString().split('T')[0];
                    break;

                case "last_week":
                    var today_day_in_month = today.getDate();
                    var today_day_in_week = today.getDay();
                    // This method changes the variable "today" and sets it on the previous monday
                    if (today_day_in_week == 0) {
                        var previous_sunday = new Date(Date.UTC(today_year, today_month,
                            today_day_in_month - 7));
                    } else {
                        var previous_sunday = new Date(Date.UTC(today_year, today_month,
                            today_day_in_month - today_day_in_week));
                    }

                    var previous_sunday_year = previous_sunday.getFullYear();
                    var previous_sunday_month = previous_sunday.getMonth();
                    var previous_sunday_day_in_month = previous_sunday.getDate();

                    var monday_before_sunday = new Date(Date.UTC(previous_sunday_year,
                        previous_sunday_month, previous_sunday_day_in_month - 6));

                    var date_from = monday_before_sunday.toISOString().split('T')[0];
                    var date_to = previous_sunday.toISOString().split('T')[0];
                    break;

                case "this_month":
                    var first_day_month = new Date(Date.UTC(today_year, today_month));
                    var date_from = first_day_month.toISOString().split('T')[0];
                    var date_to = today_date.toISOString().split('T')[0];
                    break;

                case "last_month":
                    var first_day_previous_month = new Date(Date.UTC(today_year,
                        today_month - 1));
                    var last_day_previous_month = new Date(Date.UTC(today_year,
                        today_month, 0));
                    var date_from = first_day_previous_month.toISOString().split('T')[
                        0];
                    var date_to = last_day_previous_month.toISOString().split('T')[0];
                    break;

                case "full_year":
                    var first_day_in_year = new Date(Date.UTC(today_year, 0));
                    var date_from = first_day_in_year.toISOString().split('T')[0];
                    var date_to = today_date.toISOString().split('T')[0];
                    break;

                case "financial_year":
                    if (today_month >= 6) {
                        var first_july = new Date(Date.UTC(today_year, 6));
                    } else {
                        var first_july = new Date(Date.UTC(today_year - 1, 6));
                    }
                    var date_from = first_july.toISOString().split('T')[0];
                    var date_to = today_date.toISOString().split('T')[0];
                    break;

                default:
                    var date_from = '';
                    var date_to = '';
                    break;
            }
            $('#date_from').val(date_from);
            $('#date_to').val(date_to);
        }

        function formatAMPM() {
            var date = new Date();
            var hours = date.getHours();
            var minutes = date.getMinutes();
            var ampm = hours >= 12 ? 'pm' : 'am';
            hours = hours % 12;
            hours = hours ? hours : 12; // the hour '0' should be '12'
            minutes = minutes < 10 ? '0' + minutes : minutes;
            var strTime = hours + ':' + minutes + ' ' + ampm;
            return strTime;
        }
        /**
         * @param   {Number} x
         * @returns {String} The same number, formatted in Australian dollars.
         */
        function financial(x) {
            if (typeof (x) == 'string') {
                x = parseFloat(x);
            }
            if (isNullorEmpty(x) || isNaN(x)) {
                return "$0.00";
            } else {
                return x.toLocaleString('en-AU', {
                    style: 'currency',
                    currency: 'AUD'
                });
            }
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
        /**
         * [getDate description] - Get the current date
         * @return {[String]} [description] - return the string date
         */
        function getDate() {
            var date = new Date();
            date = format.format({
                value: date,
                type: format.Type.DATE,
                timezone: format.Timezone.AUSTRALIA_SYDNEY
            });

            return date;
        }

        function isNullorEmpty(val) {
            if (val == '' || val == null) {
                return true;
            } else {
                return false;
            }
        }
        return {
            pageInit: pageInit,
            saveRecord: saveRecord,
            downloadCsv: downloadCsv
        }
    });
