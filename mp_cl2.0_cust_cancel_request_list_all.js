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

define([
	"N/email",
	"N/runtime",
	"N/search",
	"N/record",
	"N/http",
	"N/log",
	"N/error",
	"N/url",
	"N/format",
	"N/currentRecord",
], function (
	email,
	runtime,
	search,
	record,
	http,
	log,
	error,
	url,
	format,
	currentRecord
) {
	var zee = 0;
	var userId = 0;
	var role = 0;

	var baseURL = "https://1048144.app.netsuite.com";
	if (runtime.EnvType == "SANDBOX") {
		baseURL = "https://1048144-sb3.app.netsuite.com";
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
		today_day_in_month = "0" + today_day_in_month;
	}

	if (today_month < 10) {
		today_month = "0" + today_month;
	}

	var todayString = today_day_in_month + "/" + today_month + "/" + today_year;

	var current_year_month = today_year + "-" + today_month;
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
		$(".range_filter_section").addClass("hide");
		$(".range_filter_section_top").addClass("hide");
		$(".date_filter_section").addClass("hide");
		$(".period_dropdown_section").addClass("hide");

		$(".loading_section").removeClass("hide");
	}

	function afterSubmit() {
		$(".loading_section").addClass("hide");

		$(".table_section").removeClass("hide");
		$(".tabs_section").removeClass("hide");
		$(".cust_filter_section").removeClass("hide");
		$(".cust_dropdown_section").removeClass("hide");
		$(".service_change_type_section").removeClass("hide");
		$(".zee_available_buttons_section").removeClass("hide");
		$(".instruction_div").removeClass("hide");
	}

	var paramUserId = null;
	var paramSaleType = null;

	function pageInit() {
		$("#NS_MENU_ID0-item0").css("background-color", "#CFE0CE");
		$("#NS_MENU_ID0-item0 a").css("background-color", "#CFE0CE");
		$("#body").css("background-color", "#CFE0CE");

		var val1 = currentRecord.get();
		paramUserId = val1.getValue({
			fieldId: "custpage_sales_rep_id",
		});
		paramSaleType = val1.getValue({
			fieldId: "custpage_sale_type",
		});

		debtDataSet = [];
		debt_set = [];

		debtDataSetServiceChange = [];
		debt_setServiceChange = [];

		$("#applyFilter").click(function () {
			userId = $("#user_dropdown option:selected").val();
			saleType = $("#commencementtype option:selected").val();

			var url =
				baseURL +
				"/app/site/hosting/scriptlet.nl?script=1719&deploy=1&user=" +
				userId +
				"&saletype=" +
				saleType;

			window.location.href = url;
		});

		submitSearch();
		var dataTable = $("#mpexusage-cancel_list").DataTable();

		var today = new Date();
		var today_year = today.getFullYear();
		var today_month = today.getMonth();
		var today_day = today.getDate();

		/**
		 *  Click for Instructions Section Collapse
		 */
		$(".collapse").on("shown.bs.collapse", function () {
			$(".range_filter_section_top").css("padding-top", "500px");
		});
		$(".collapse").on("hide.bs.collapse", function () {
			$(".range_filter_section_top").css("padding-top", "0px");
		});

		$(".savecustomer").click(function () {
			var customerInternalId = $(this).attr("data-id");

			console.log("customerInternalId: " + customerInternalId);

			//Sales Record - In Use
			var salesRecordsActiveSearch = search.load({
				type: "customrecord_sales",
				id: "customsearch_active_sales_record",
			});

			salesRecordsActiveSearch.filters.push(
				search.createFilter({
					name: "internalid",
					join: "custrecord_sales_customer",
					operator: search.Operator.ANYOF,
					values: customerInternalId,
				})
			);

			var countSalesRecord = 0;

			salesRecordsActiveSearch
				.run()
				.each(function (salesRecordsActiveSearchResultSet) {
					var salesRecordInternalId =
						salesRecordsActiveSearchResultSet.getValue({
							name: "internalid",
						});

					console.log("Updating Sales Record: " + salesRecordInternalId);

					var sales_record = record.load({
						type: "customrecord_sales",
						id: salesRecordInternalId,
					});

					sales_record.setValue({
						fieldId: "custrecord_sales_completed",
						value: true,
					});

					sales_record.save();

					console.log("Sales Record: " + salesRecordInternalId + " updated");
					countSalesRecord++;
					return true;
				});

			console.log("Sales Records Updated: " + countSalesRecord);

			var sales_record = record.create({
				type: "customrecord_sales",
			});

			sales_record.setValue({
				fieldId: "custrecord_sales_outcome",
				value: 20,
			});

			sales_record.setValue({
				fieldId: "custrecord_sales_campaign",
				value: 68,
			});

			sales_record.setValue({
				fieldId: "custrecord_sales_customer",
				value: customerInternalId,
			});

			sales_record.setValue({
				fieldId: "custrecord_sales_assigned",
				value: runtime.getCurrentUser().id,
			});

			sales_record.setValue({
				fieldId: "custrecord_sales_lastcalldate",
				value: getDateStoreNS(),
			});

			var newSalesRecord = sales_record.save();

			var customer_record = record.load({
				type: record.Type.CUSTOMER,
				id: parseInt(customerInternalId),
				isDynamic: true,
			});

			customer_record.setValue({
				fieldId: "custentity_cancel_ongoing",
				value: 1,
			});
			if (
				isNullorEmpty(
					customer_record.getValue({
						fieldId: "custentity_cancel_ongoing_start_date",
						value: getDateStoreNS(),
					})
				)
			) {
				customer_record.setValue({
					fieldId: "custentity_cancel_ongoing_start_date",
					value: getDateStoreNS(),
				});
			}

			customer_record.save();

			var convertLink =
				"https://1048144.app.netsuite.com/app/site/hosting/scriptlet.nl?script=1900&deploy=1&compid=1048144&callCenter=T&customerId=" +
				parseInt(customerInternalId) +
				"&salesRecordId=" +
				newSalesRecord;
			window.location.href = convertLink;
		});

		$(".notifyitteam").click(function () {
			var customerInternalId = $(this).attr("data-id");

			var convertLink =
				"https://1048144.app.netsuite.com/app/site/hosting/scriptlet.nl?script=1722&deploy=1&compid=1048144&custid=" +
				parseInt(customerInternalId);
			window.location.href = convertLink;
		});

		$(".viewcustomer").click(function () {
			var customerInternalId = $(this).attr("data-id");
			var salesRecordInternalId = $(this).attr("data-salesrecord");

			var convertLink =
				"https://1048144.app.netsuite.com/app/site/hosting/scriptlet.nl?script=740&deploy=1&compid=1048144&callcenter=T&recid=" +
				parseInt(customerInternalId) +
				"&sales_record_id=" +
				salesRecordInternalId;
			window.location.href = convertLink;
		});

		//On click of close icon in the modal
		$(".close").click(function () {
			$("#myModal").hide();
		});
	}

	//Initialise the DataTable with headers.
	function submitSearch() {
		// duringSubmit();

		dataTable = $("#mpexusage-cancel_list").DataTable({
			destroy: true,
			data: debtDataSet,
			pageLength: 1000,
			order: [[5, "des"]],
			layout: {
				topStart: {
					buttons: [
						{
							extend: "copy",
							text: "Copy",
							className: "btn btn-default exportButtons",
							exportOptions: {
								columns: ":not(.notexport)",
							},
						},
						{
							extend: "csv",
							text: "CSV",
							className: "btn btn-default exportButtons",
							exportOptions: {
								columns: ":not(.notexport)",
							},
						},
						{
							extend: "excel",
							text: "Excel",
							className: "btn btn-default exportButtons",
							exportOptions: {
								columns: ":not(.notexport)",
							},
						},
						{
							extend: "pdf",
							text: "PDF",
							className: "btn btn-default exportButtons",
							exportOptions: {
								columns: ":not(.notexport)",
							},
						},
						{
							extend: "print",
							text: "Print",
							className: "btn btn-default exportButtons",
							exportOptions: {
								columns: ":not(.notexport)",
							},
						},
					],
				},
			},
			columns: [
				{
					title: "ACTIONS",
				},
				{
					title: "ID",
				},
				{
					title: "COMPANY NAME",
				},
				{
					title: "FRANCHISEE",
				},
				{
					title: "STATUS",
				},
				{
					title: "REQUEST DATE",
				},
				{
					title: "DATE EFFECT",
				},
				{
					title: "REQUESTER NAME",
				},
				{
					title: "REQUESTER PHONE",
				},
				{
					title: "REQUESTER EMAIL",
				},
				{
					title: "ON GOING",
				},
			],
			columnDefs: [
				{
					targets: [2, 3, 4],
					className: "bolded",
				},
				{
					targets: [0, 2],
					className: "col-xs-2",
				},
				{
					targets: [3, 4],
					className: "col-xs-1",
				},
			],
			rowCallback: function (row, data, index) {
				if (data[10] == "Yes") {
					$("td", row).css("background-color", "#DBE4C6");
				} else {
					$("td", row).css("background-color", "#FFFFFF");
				}
			},
		});

		dataTableServiceChange = $("#mpexusage-service_change_list").DataTable({
			destroy: true,
			data: debtDataSetServiceChange,
			pageLength: 1000,
			order: [[5, "des"]],
			layout: {
				topStart: {
					buttons: [
						{
							extend: "copy",
							text: "Copy",
							className: "btn btn-default exportButtons",
							exportOptions: {
								columns: ":not(.notexport)",
							},
						},
						{
							extend: "csv",
							text: "CSV",
							className: "btn btn-default exportButtons",
							exportOptions: {
								columns: ":not(.notexport)",
							},
						},
						{
							extend: "excel",
							text: "Excel",
							className: "btn btn-default exportButtons",
							exportOptions: {
								columns: ":not(.notexport)",
							},
						},
						{
							extend: "pdf",
							text: "PDF",
							className: "btn btn-default exportButtons",
							exportOptions: {
								columns: ":not(.notexport)",
							},
						},
						{
							extend: "print",
							text: "Print",
							className: "btn btn-default exportButtons",
							exportOptions: {
								columns: ":not(.notexport)",
							},
						},
					],
				},
			},
			columns: [
				{
					title: "ACTIONS",
				},
				{
					title: "ID",
				},
				{
					title: "COMPANY NAME",
				},
				{
					title: "FRANCHISEE",
				},
				{
					title: "STATUS",
				},
				{
					title: "REQUEST DATE",
				},
				{
					title: "DATE EFFECT",
				},
				{
					title: "REQUESTER NAME",
				},
				{
					title: "REQUESTER PHONE",
				},
				{
					title: "REQUESTER EMAIL",
				},
				{
					title: "ON GOING",
				},
			],
			columnDefs: [
				{
					targets: [2, 3, 4],
					className: "bolded",
				},
				{
					targets: [0, 2],
					className: "col-xs-2",
				},
				{
					targets: [3, 4],
					className: "col-xs-1",
				},
			],
			rowCallback: function (row, data, index) {
				if (data[10] == "Yes") {
					$("td", row).css("background-color", "#DBE4C6");
				} else {
					$("td", row).css("background-color", "#FFFFFF");
				}
			},
		});

		loadSearch();
		afterSubmit();
	}

	function loadSearch() {
		//Customer Service Change - Requested List
		var custListCancellationRequestSearch = search.load({
			type: "customer",
			id: "customsearch_cust_cancellation_requested",
		});

		if (!isNullorEmpty(paramUserId)) {
			custListCancellationRequestSearch.filters.push(
				search.createFilter({
					name: "custentity_sales_rep_assigned",
					join: "partner",
					operator: search.Operator.IS,
					values: paramUserId,
				})
			);
		}

		if (!isNullorEmpty(paramSaleType)) {
			custListCancellationRequestSearch.filters.push(
				search.createFilter({
					name: "custentity_cust_service_change_type",
					join: null,
					operator: search.Operator.IS,
					values: paramSaleType,
				})
			);
		}

		custListCancellationRequestSearch
			.run()
			.each(function (custListCancellationRequestSearchResultSet) {
				var custInternalID =
					custListCancellationRequestSearchResultSet.getValue({
						name: "internalid",
					});
				var custEntityID = custListCancellationRequestSearchResultSet.getValue({
					name: "entityid",
				});
				var custName = custListCancellationRequestSearchResultSet.getValue({
					name: "companyname",
				});
				var zeeID = custListCancellationRequestSearchResultSet.getValue({
					name: "partner",
				});
				var zeeName = custListCancellationRequestSearchResultSet.getText({
					name: "partner",
				});

				var statusText = custListCancellationRequestSearchResultSet.getText({
					name: "entitystatus",
				});

				var serviceCancellationRequestedDate =
					custListCancellationRequestSearchResultSet.getValue({
						name: "custentity_cancellation_requested_date",
					});
				if (isNullorEmpty(serviceCancellationRequestedDate)) {
					serviceCancellationRequestedDate = "";
				}

				var serviceCancellationDate =
					custListCancellationRequestSearchResultSet.getValue({
						name: "custentity13",
					});
				if (isNullorEmpty(serviceCancellationDate)) {
					serviceCancellationDate = "";
				}
				var requesterName = custListCancellationRequestSearchResultSet.getValue(
					{
						name: "custentity_hc_mailcon_name",
					}
				);
				var requesterPhone =
					custListCancellationRequestSearchResultSet.getValue({
						name: "custentity_hc_mailcon_phone",
					});
				var requesterEmail =
					custListCancellationRequestSearchResultSet.getValue({
						name: "custentity_hc_mailcon_email",
					});
				var cancelOngoingText =
					custListCancellationRequestSearchResultSet.getText({
						name: "custentity_cancel_ongoing",
					});

				var cancellationRequested =
					custListCancellationRequestSearchResultSet.getValue({
						name: "custentity_cancellation_requested",
					});

				var serviceChangeType =
					custListCancellationRequestSearchResultSet.getValue({
						name: "custentity_cust_service_change_type",
					});

				console.log('custInternalID: ' + custInternalID);
				console.log('custName: ' + custName);
				console.log('cancellationRequested: ' + cancellationRequested);
				console.log('serviceChangeType: ' + serviceChangeType);

				if (serviceChangeType == 13 || cancellationRequested == 1) {
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
						requesterEmail: requesterEmail,
					});
				} else {
					debt_setServiceChange.push({
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
						requesterEmail: requesterEmail,
					});
				}

				return true;
			});

		console.log(debt_set);
		console.log(debt_setServiceChange);

		loadDatatable(debt_set, debt_setServiceChange);
		debt_set = [];
	}

	function loadDatatable(debt_rows, debt_rows_service_change) {
		debtDataSet = [];
		csvSet = [];
		debtDataSetServiceChange = [];
		csvSetServiceChange = [];

		if (!isNullorEmpty(debt_rows)) {
			debt_rows.forEach(function (debt_row, index) {
				//Sales Record - In Use
				var salesRecordsActiveSearch = search.load({
					type: "customrecord_sales",
					id: "customsearch_active_sales_record",
				});

				salesRecordsActiveSearch.filters.push(
					search.createFilter({
						name: "internalid",
						join: "custrecord_sales_customer",
						operator: search.Operator.ANYOF,
						values: debt_row.custInternalID,
					})
				);

				var resultRange = salesRecordsActiveSearch.run().getRange({
					start: 0,
					end: 1,
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
							name: "internalid",
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
					debt_row.custInternalID +
					'&whence=" target="_blank"><b>' +
					debt_row.custEntityID +
					"</b></a>";

				if (!isNullorEmpty(debt_row.serviceCancellationRequestedDate)) {
					var requestDateSplit =
						debt_row.serviceCancellationRequestedDate.split("/");

					if (parseInt(requestDateSplit[1]) < 10) {
						requestDateSplit[1] = "0" + requestDateSplit[1];
					}

					if (parseInt(requestDateSplit[0]) < 10) {
						requestDateSplit[0] = "0" + requestDateSplit[0];
					}

					var requestDateString =
						requestDateSplit[2] +
						"-" +
						requestDateSplit[1] +
						"-" +
						requestDateSplit[0];
				} else {
					var requestDateString = "";
				}

				if (!isNullorEmpty(debt_row.serviceCancellationDate)) {
					var cancellationDateSplit =
						debt_row.serviceCancellationDate.split("/");

					if (parseInt(cancellationDateSplit[1]) < 10) {
						cancellationDateSplit[1] = "0" + cancellationDateSplit[1];
					}

					if (parseInt(cancellationDateSplit[0]) < 10) {
						cancellationDateSplit[0] = "0" + cancellationDateSplit[0];
					}

					var cancellationDateString =
						cancellationDateSplit[2] +
						"-" +
						cancellationDateSplit[1] +
						"-" +
						cancellationDateSplit[0];
				} else {
					var cancellationDateString = "";
				}

				debtDataSet.push([
					linkURL,
					customerIDLink,
					debt_row.custName,
					debt_row.zeeName,
					debt_row.statusText,
					requestDateString,
					cancellationDateString,
					debt_row.requesterName,
					debt_row.requesterPhone,
					debt_row.requesterEmail,
					debt_row.cancelOngoingText,
				]);
			});
		}

		var datatable = $("#mpexusage-cancel_list").DataTable();
		datatable.clear();
		datatable.rows.add(debtDataSet);
		datatable.draw();

		if (!isNullorEmpty(debt_rows_service_change)) {
			debt_rows_service_change.forEach(function (debt_row, index) {
				//Sales Record - In Use
				var salesRecordsActiveSearch = search.load({
					type: "customrecord_sales",
					id: "customsearch_active_sales_record",
				});

				salesRecordsActiveSearch.filters.push(
					search.createFilter({
						name: "internalid",
						join: "custrecord_sales_customer",
						operator: search.Operator.ANYOF,
						values: debt_row.custInternalID,
					})
				);

				var resultRange = salesRecordsActiveSearch.run().getRange({
					start: 0,
					end: 1,
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
							name: "internalid",
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
					debt_row.custInternalID +
					'&whence=" target="_blank"><b>' +
					debt_row.custEntityID +
					"</b></a>";

				if (!isNullorEmpty(debt_row.serviceCancellationRequestedDate)) {
					var requestDateSplit =
						debt_row.serviceCancellationRequestedDate.split("/");

					if (parseInt(requestDateSplit[1]) < 10) {
						requestDateSplit[1] = "0" + requestDateSplit[1];
					}

					if (parseInt(requestDateSplit[0]) < 10) {
						requestDateSplit[0] = "0" + requestDateSplit[0];
					}

					var requestDateString =
						requestDateSplit[2] +
						"-" +
						requestDateSplit[1] +
						"-" +
						requestDateSplit[0];
				} else {
					var requestDateString = "";
				}

				if (!isNullorEmpty(debt_row.serviceCancellationDate)) {
					var cancellationDateSplit =
						debt_row.serviceCancellationDate.split("/");

					if (parseInt(cancellationDateSplit[1]) < 10) {
						cancellationDateSplit[1] = "0" + cancellationDateSplit[1];
					}

					if (parseInt(cancellationDateSplit[0]) < 10) {
						cancellationDateSplit[0] = "0" + cancellationDateSplit[0];
					}

					var cancellationDateString =
						cancellationDateSplit[2] +
						"-" +
						cancellationDateSplit[1] +
						"-" +
						cancellationDateSplit[0];
				} else {
					var cancellationDateString = "";
				}

				debtDataSetServiceChange.push([
					linkURL,
					customerIDLink,
					debt_row.custName,
					debt_row.zeeName,
					debt_row.statusText,
					requestDateString,
					cancellationDateString,
					debt_row.requesterName,
					debt_row.requesterPhone,
					debt_row.requesterEmail,
					debt_row.cancelOngoingText,
				]);
			});
		}

		var datatable = $("#mpexusage-service_change_list").DataTable();
		datatable.clear();
		datatable.rows.add(debtDataSetServiceChange);
		datatable.draw();

		return true;
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

	function saveRecord() {
		return true;
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

	function replaceAll(string) {
		return string.split("/").join("-");
	}

	function formatAMPM() {
		var date = new Date();
		var hours = date.getHours();
		var minutes = date.getMinutes();
		var ampm = hours >= 12 ? "pm" : "am";
		hours = hours % 12;
		hours = hours ? hours : 12; // the hour '0' should be '12'
		minutes = minutes < 10 ? "0" + minutes : minutes;
		var strTime = hours + ":" + minutes + " " + ampm;
		return strTime;
	}
	/**
	 * @param   {Number} x
	 * @returns {String} The same number, formatted in Australian dollars.
	 */
	function financial(x) {
		if (typeof x == "string") {
			x = parseFloat(x);
		}
		if (isNullorEmpty(x) || isNaN(x)) {
			return "$0.00";
		} else {
			return x.toLocaleString("en-AU", {
				style: "currency",
				currency: "AUD",
			});
		}
	}
	/**
	 * Used to pass the values of `date_from` and `date_to` between the scripts and to Netsuite for the records and the search.
	 * @param   {String} date_iso       "2020-06-01"
	 * @returns {String} date_netsuite  "1/6/2020"
	 */
	function dateISOToNetsuite(date_iso) {
		var date_netsuite = "";
		if (!isNullorEmpty(date_iso)) {
			var date_utc = new Date(date_iso);
			// var date_netsuite = nlapiDateToString(date_utc);
			var date_netsuite = format.format({
				value: date_utc,
				type: format.Type.DATE,
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
	};
});
