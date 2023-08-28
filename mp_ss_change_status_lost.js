/**
 * Module Description
 *
 * NSVersion    Date                        Author
 * 1.00         2021-11-15 13:18:23         Ankith
 *
 * Description: Hit RTA API to inform to deactivate customer.
 *
 * @Last modified by:   ankithravindran
 * @Last modified time: 2022-01-20T12:42:56+11:00
 *
 */

var tollPODPDF = 324;

var adhoc_inv_deploy = 'customdeploy2';
var prev_inv_deploy = null;
var ctx = nlapiGetContext();
var usageThreshold = 50;

function main() {

  //SEARCH: Customer - Status Change - Lost
  var customerLostTomorrowSearch = nlapiLoadSearch('customer',
    'customsearch_customer_change_status_lost');

  var resultCustomerLostTomorrowSearch = customerLostTomorrowSearch.runSearch();

  resultCustomerLostTomorrowSearch.forEachResult(function (searchResult) {
    var internalID = searchResult.getValue("internalid");
    var entityID = searchResult.getValue("entityid");
    var companyName = searchResult.getValue("companyname");
    var partnerID = searchResult.getValue("partner");
    var dateEffective = searchResult.getValue("custentity13");
    var partnerText = searchResult.getText("partner");

    var record = nlapiLoadRecord('customer', internalID);
    record.setFieldValue('entitystatus', 22);
    nlapiSubmitRecord(record);

    nlapiSendEmail(409635, ['popie.popie@mailplus.com.au', 'fiona.harrison@mailplus.com.au'],
      'Customer Cancelled - ' + dateEffective, ' Customer NS ID: ' +
      internalID +
      '</br> Customer: ' + entityID + ' ' + companyName +
      '</br> Customer Franchisee NS ID: ' + partnerID, ['ankith.ravindran@mailplus.com.au']);

    var customerJSON = '{';
    customerJSON += '"ns_id" : "' + internalID + '"'
    customerJSON += '}';

    var headers = {};
    headers['Content-Type'] = 'application/json';
    headers['Accept'] = 'application/json';
    headers['x-api-key'] = 'XAZkNK8dVs463EtP7WXWhcUQ0z8Xce47XklzpcBj';

    nlapiRequestURL('https://mpns.protechly.com/deactivate_customer',
      customerJSON,
      headers);
    return true;
  });

}
