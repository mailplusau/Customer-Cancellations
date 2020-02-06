/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */

define(['N/error', 'N/runtime', 'N/search', 'N/url', 'N/record', 'N/format', 'N/email'],
    function(error, runtime, search, url, record, format, email) {
        var baseURL = 'https://1048144.app.netsuite.com';
        if (runtime.EnvType == "SANDBOX") {
            baseURL = 'https://system.sandbox.netsuite.com';
        }

        var zee = 0;
        var role = runtime.getCurrentUser().role;

        if (role == 1000) {
            zee = runtime.getCurrentUser();
        } else if (role == 3) { //Administrator
            zee = 6; //test
        } else if (role == 1032) { // System Support
            zee = 425904; //test-AR
        }

        var customer_id = null;
        var type = null;

        var nominated_customers = [];
        var new_nominated_customers = [];
        var unnominated_customers = [];
        var reviewed_customers = [];

        function showAlert(message) {
            $('#alert').html('<button type="button" class="close">&times;</button>' + message);
            $('#alert').show();
            document.body.scrollTop = 0; // For Safari
            document.documentElement.scrollTop = 0;
            // $(window).scrollTop($('#alert').offset().top);
        }


        function pageInit(context) {

            $('#alert').hide();
            $('.create_nominate_section').hide();
            $('.customer_section').hide();

            customer_id = $('#customer_id').val();

            // $(document).ready(function() {
            //     $('#email_body').summernote({

            //     });
            // });


            //JQuery functions that needs to be carried out based on User Interaction

            $(window).load(function() {
                // Animate loader off screen
                $(".se-pre-con").fadeOut("slow");
            });

            $(".nav-tabs").on("click", "a", function(e) {

                $(this).tab('show');
            });

            $(document).on('click', '#alert .close', function(e) {
                $(this).parent().hide();
            });

            $(document).on('change', '#survey1', function(e) {
                if ($('#survey1 option:selected').val() == 2) {
                    $('#survey2').val(2);
                    $('#survey2').hide()
                    $('.survey2').hide()
                    $('#survey3').val(2);
                    $('#survey3').hide();
                    $('.survey3').hide();
                } else {
                    $('#survey2').val();
                    $('#survey2').show()
                    $('.survey2').show()
                    $('#survey3').val();
                    $('#survey3').show();
                    $('.survey3').show();
                }
            });

            $(document).on("change", ".zee_dropdown", function(e) {

                var zee = $(this).val();

                $('#hiddenzee').val(zee);

                var url = baseURL + "/app/site/hosting/scriptlet.nl?script=750&deploy=1&type=nominate";

                url += "&zee=" + zee + "";

                window.location.href = url;
            });

            $(document).on('change', '#campaign', function(e) {
                var campaign_id = $('#campaign option:selected').val();
                var campaign_record_type = $('#campaign option:selected').attr('data-recordtype');

                $('#camp_id').val(campaign_id);

                $('.create_nominate_section').show();

                if (campaign_record_type == 1) {
                    $('.create').hide();
                } else {
                    $('.create').show();
                }
                $('.nominate').show();
            });



            $(document).on('click', '#create_note', function(event) {

                var result = validate('true');
                if (result == false) {
                    return false;
                }
                customer_id = createUpdateCustomer(customer_id);
                // if (!isNullorEmpty($('#note').val())) {
                //     createUserNote(customer_id);
                // }
                var params2 = {
                    custid: customer_id,
                    sales_record_id: null,
                    reason: $('#cancel_reason option:selected').text(),
                    id: 'customscript_sl_customer_cancellation',
                    deploy: 'customdeploy_sl_customer_cancellation',
                    type: 'create',
                    cancel: 'true'
                };
                params2 = JSON.stringify(params2);
                var par = {
                    params: params2
                }
                var output = url.resolveScript({
                    scriptId: 'customscript_sl_create_user_note',
                    deploymentId: 'customdeploy_sl_create_user_note',
                    returnExternalUrl: false,
                    params: par
                });

                var upload_url = baseURL + output;
                window.open(upload_url, "_self", "height=750,width=650,modal=yes,alwaysRaised=yes");
            });


        }

        function saveRecord(context) {

            console.log(customer_id)
            console.log(runtime.getCurrentUser())
            console.log(runtime.getCurrentUser().id)

            var cancel_date = $('#cancel_date').val();

            var split_date = cancel_date.split('-');

            cancel_date = split_date[2] + '/' + split_date[1] + '/' + split_date[0];

            console.log(cancel_date)

            cancel_date = format.parse({
                value: cancel_date,
                type: format.Type.DATE,
                timezone: format.Timezone.AUSTRALIA_SYDNEY
            })

            console.log(cancel_date)

            var phoneCallRecord = record.create({
                type: record.Type.PHONE_CALL,
                isDynamic: true
            });

            phoneCallRecord.setValue({
                fieldId: 'company',
                value: customer_id
            });

            phoneCallRecord.setValue({
                fieldId: 'startdate',
                value: getDate()
            });

            phoneCallRecord.setValue({
                fieldId: 'custevent_organiser',
                value: runtime.getCurrentUser().id
            });

            phoneCallRecord.setValue({
                fieldId: 'custevent_call_type',
                value: 2
            });

            // phoneCallRecord.setValue({
            //     fieldId: 'message',
            //     // value: $('#email_body').summernote('code')
            // });

            phoneCallRecord.setValue({
                fieldId: 'title',
                value: 'Cancellation'
            });

            phoneCallRecord.setValue({
                fieldId: 'assigned',
                value: $('#zee_id').val()
            });

            phoneCallRecord.setValue({
                fieldId: 'status',
                value: 'COMPLETE'
            });

            var phoneCallRecordId = phoneCallRecord.save();

            console.log('end of phone call')

            // var userNoteRecord = record.create({
            //     type: record.Type.NOTE,
            //     isDynamic: true
            // });

            // userNoteRecord.setValue({
            //     fieldId: 'entity',
            //     value: customer_id
            // });

            userNoteRecord.setValue({
                fieldId: 'title',
                value: 'Cancellation'
            });


            // userNoteRecord.setValue({
            //     fieldId: 'note',
            //     value: $('#email_body').summernote('code')
            // });


            // // userNoteRecord.setValue({
            // //     fieldId: 'author',
            // //     value: runtime.getCurrentUser().id
            // // });

            // // userNoteRecord.setValue({
            // //     fieldId: 'notedate',
            // //     value: getDate()
            // // });

            // var userNoteRecordId = userNoteRecord.save();

            console.log('end of user note');

            commRegSearch = search.load({
                id: 'customsearch_comm_reg_signed'
            });

            commRegSearch.filters.push(search.createFilter({
                name: 'custrecord_customer',
                operator: search.Operator.IS,
                values: customer_id
            }));


            commRegSearch.run().each(function(searchResult) {

                var commRegID = searchResult.getValue({
                    name: 'internalid'
                });
                var commRegRecord = record.load({
                    type: 'customrecord_commencement_register',
                    id: commRegID
                });

                commRegRecord.setValue({
                    fieldId: 'custrecord_trial_status',
                    value: 3,
                });

                var commRegRecordId = commRegRecord.save();

                return true;
            });

            var customerRecord = record.load({
                type: record.Type.CUSTOMER,
                id: customer_id
            });



            customerRecord.setValue({
                fieldId: 'custentity13',
                value: cancel_date,
            });

            customerRecord.setValue({
                fieldId: 'custentity_service_cancellation_notice',
                value: $('#cancel_notice option:selected').val(),
            });

            customerRecord.setValue({
                fieldId: 'custentity_service_cancellation_reason',
                value: $('#cancel_reason option:selected').val(),
            });

            customerRecord.setValue({
                fieldId: 'custentity14',
                value: $('#cancel_comp option:selected').val(),
            });

            customerRecord.setValue({
                fieldId: 'entitystatus',
                value: 22,
            });

            var customerRecordId = customerRecord.save();

            console.log('end of customer')


            var params2 = {
                custid: customer_id
            };

            var output = url.resolveScript({
                scriptId: 'customscript_sl_customer_cancellation',
                deploymentId: 'customdeploy_sl_customer_cancellation',
                returnExternalUrl: false,
                params: params2
            });


            var upload_url = baseURL + output;
            window.open(upload_url, "_self", "height=750,width=650,modal=yes,alwaysRaised=yes");

        }

        function validateField(context) {

        }

        function fieldChanged(context) {

        }

        function postSourcing(context) {

        }

        function lineInit(context) {

        }

        function validateDelete(context) {

        }

        function validateInsert(context) {

        }

        function validateLine(context) {

        }

        function sublistChanged(context) {

        }

        function validate(status) {

            var cancel_date = $('#cancel_date').val();


            var cancel_reason = $('#cancel_reason option:selected').val();
            var cancel_notice = $('#cancel_notice option:selected').val();
            // var survey3 = $('#survey3 option:selected').val();

            console.log(cancel_reason);
            console.log(cancel_notice);

            var return_value = true;

            var alertMessage = ''

            if (isNullorEmpty(cancel_date)) {
                alertMessage += 'Please Select Cancellation Date</br>';
                return_value = false;
            }

            if (isNullorEmpty(cancel_reason)) {
                alertMessage += 'Please Select Cancellation Reason</br>';
                return_value = false;
            }
            if (isNullorEmpty(cancel_notice)) {
                alertMessage += 'Please Select Cancellation Notice </br>';
                return_value = false;
            }


            if (return_value == false) {
                showAlert(alertMessage);

            }
            return return_value;
        }

        function createUpdateCustomer(customer_id, update_status) {


            var cancel_date = $('#cancel_date').val();

            var split_date = cancel_date.split('-');

            cancel_date = split_date[2] + '/' + split_date[1] + '/' + split_date[0];
            cancel_date = format.parse({
                value: cancel_date,
                type: format.Type.DATE,
                timezone: format.Timezone.AUSTRALIA_SYDNEY
            })


            var cancel_reason = $('#cancel_reason option:selected').val();
            var cancel_notice = $('#cancel_notice option:selected').val();
            var cancel_comp = $('#cancel_comp option:selected').val();

            var phoneCallRecord = record.create({
                type: record.Type.PHONE_CALL,
                isDynamic: true
            });

            phoneCallRecord.setValue({
                fieldId: 'company',
                value: customer_id
            });

            phoneCallRecord.setValue({
                fieldId: 'startdate',
                value: getDate()
            });

            phoneCallRecord.setValue({
                fieldId: 'custevent_organiser',
                value: runtime.getCurrentUser().id
            });

            phoneCallRecord.setValue({
                fieldId: 'custevent_call_type',
                value: 2
            });

            phoneCallRecord.setValue({
                fieldId: 'message',
                value: 'Operator Notified'
            });

            phoneCallRecord.setValue({
                fieldId: 'title',
                value: 'Cancellation'
            });

            phoneCallRecord.setValue({
                fieldId: 'assigned',
                value: $('#zee_id').val()
            });

            phoneCallRecord.setValue({
                fieldId: 'status',
                value: 'COMPLETE'
            });

            var phoneCallRecordId = phoneCallRecord.save();

            commRegSearch = search.load({
                id: 'customsearch_comm_reg_signed'
            });

            commRegSearch.filters.push(search.createFilter({
                name: 'custrecord_customer',
                operator: search.Operator.IS,
                values: customer_id
            }));


            commRegSearch.run().each(function(searchResult) {

                var commRegID = searchResult.getValue({
                    name: 'internalid'
                });
                var commRegRecord = record.load({
                    type: 'customrecord_commencement_register',
                    id: commRegID
                });

                commRegRecord.setValue({
                    fieldId: 'custrecord_trial_status',
                    value: 3,
                });

                var commRegRecordId = commRegRecord.save();

                return true;
            });


            var customerRecord = record.load({
                type: record.Type.CUSTOMER,
                id: customer_id
            });

            customerRecord.setValue({
                fieldId: 'entitystatus',
                value: 22,
            });

            customerRecord.setValue({
                fieldId: 'custentity13',
                value: cancel_date,
            });

            customerRecord.setValue({
                fieldId: 'custentity_service_cancellation_notice',
                value: cancel_notice,
            });

            customerRecord.setValue({
                fieldId: 'custentity_service_cancellation_reason',
                value: cancel_reason,
            });

            if (!isNullorEmpty(cancel_comp)) {
                customerRecord.setValue({
                    fieldId: 'custentity14',
                    value: cancel_comp,
                });
            }



            var customerRecordId = customerRecord.save({
                enableSourcing: false,
                ignoreMandatoryFields: true
            });

            return customerRecordId;


        }



        // function createUserNote(customer_id) {

        //     // try {

        //         alert(customer_id);
        //         var userNoteRecord = record.create({
        //             type: record.Type.NOTE
        //         });

        //         userNoteRecord.setValue({
        //             fieldId: 'entity',
        //             value: customer_id
        //         });

        //         userNoteRecord.setValue({
        //             fieldId: 'direction',
        //             value: $('#direction option:selected').val()
        //         });

        //         userNoteRecord.setValue({
        //             fieldId: 'notetype',
        //             value: $('#notetype option:selected').val()
        //         });

        //         userNoteRecord.setValue({
        //             fieldId: 'note',
        //             value: $('#note').val()
        //         });


        //         userNoteRecord.setValue({
        //             fieldId: 'author',
        //             value: runtime.getCurrentUser().id
        //         });

        //         userNoteRecord.setValue({
        //             fieldId: 'notedate',
        //             value: getDate()
        //         });

        //         var userNoteRecordId = userNoteRecord.save({
        //             enableSourcing: true,
        //             ignoreMandatoryFields: true
        //         });
        //     // } catch (e) {
        //     //     alert(e);
        //     // }

        // }

        function isNullorEmpty(strVal) {
            return (strVal == null || strVal == '' || strVal == 'null' || strVal == undefined || strVal == 'undefined' || strVal == '- None -');
        }

        function validatePhone(val) {

            var digits = val.replace(/[^0-9]/g, '');
            var australiaPhoneFormat = /^(\+\d{2}[ \-]{0,1}){0,1}(((\({0,1}[ \-]{0,1})0{0,1}\){0,1}[2|3|7|8]{1}\){0,1}[ \-]*(\d{4}[ \-]{0,1}\d{4}))|(1[ \-]{0,1}(300|800|900|902)[ \-]{0,1}((\d{6})|(\d{3}[ \-]{0,1}\d{3})))|(13[ \-]{0,1}([\d \-]{5})|((\({0,1}[ \-]{0,1})0{0,1}\){0,1}4{1}[\d \-]{8,10})))$/;
            var phoneFirst6 = digits.substring(0, 6);
            //Check if all phone characters are numerals
            if (val != digits) {
                showAlert('Phone numbers should contain numbers only.\n\nPlease re-enter the phone number without spaces or special characters.');
                return false;
            } else if (digits.length != 10) {
                //Check if phone is not blank, need to contains 10 digits
                showAlert('Please enter a 10 digit phone number with area code.');
                return false;
            } else if (!(australiaPhoneFormat.test(digits))) {
                //Check if valid Australian phone numbers have been entered
                showAlert('Please enter a valid Australian phone number.\n\nNote: 13 or 12 numbers are not accepted');
                return false;
            } else if (digits.length == 10) {
                //Check if all 10 digits are the same numbers using checkDuplicate function
                if (checkDuplicate(digits)) {
                    showAlert('Please enter a valid 10 digit phone number.');
                    return false;
                }
            }
        }

        function checkDuplicate(digits) {
            var digit01 = digits.substring(0, 1);
            var digit02 = digits.substring(1, 2);
            var digit03 = digits.substring(2, 3);
            var digit04 = digits.substring(3, 4);
            var digit05 = digits.substring(4, 5);
            var digit06 = digits.substring(5, 6);
            var digit07 = digits.substring(6, 7);
            var digit08 = digits.substring(7, 8);
            var digit09 = digits.substring(8, 9);
            var digit10 = digits.substring(9, 10);

            if (digit01 == digit02 && digit02 == digit03 && digit03 == digit04 && digit04 == digit05 && digit05 == digit06 && digit06 == digit07 && digit07 == digit08 && digit08 == digit09 && digit09 == digit10) {
                return true;
            } else {
                return false;
            }
        }

        function verify_abn(str) {

            if (!str || str.length !== 11) {
                alert('Invalid ABN');
                return false;
            }
            var weights = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19],
                checksum = str.split('').map(Number).reduce(
                    function(total, digit, index) {
                        if (!index) {
                            digit--;
                        }
                        return total + (digit * weights[index]);
                    },
                    0
                );

            if (!checksum || checksum % 89 !== 0) {
                showAlert('Invalid ABN');
                return false;
            }

            return true;
        }

        function getDate() {
            var date = new Date();
            format.format({
                value: date,
                type: format.Type.DATE,
                timezone: format.Timezone.AUSTRALIA_SYDNEY
            })

            return date;
        }

        return {
            pageInit: pageInit,
            fieldChanged: fieldChanged,
            postSourcing: postSourcing,
            sublistChanged: sublistChanged,
            lineInit: lineInit,
            validateField: validateField,
            validateLine: validateLine,
            validateInsert: validateInsert,
            validateDelete: validateDelete,
            saveRecord: saveRecord
        };
    });