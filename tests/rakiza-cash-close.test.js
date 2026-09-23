const fs=require('fs');
const vm=require('vm');

const source=fs.readFileSync(require.resolve('../rakiza-cash-close.js'),'utf8');
const sandbox={module:{exports:{}},exports:{},console,window:{},document:{getElementById(){return null},querySelector(){return null}},navigator:{}};
vm.runInNewContext(source,sandbox,{filename:'rakiza-cash-close.js'});
const cash=sandbox.module.exports;

let pass=0;
function ok(condition,message,got){if(!condition){console.error('FAIL',message,got??'');process.exit(1)}pass++}

ok(cash.netOfVat(11500)===10000,'extracts 15% VAT from gross sales',cash.netOfVat(11500));
ok(cash.netOfVat(100)===86.96,'rounds net sales to two decimals',cash.netOfVat(100));

const result=cash.calculate({opening_balance:1000,cash_sales:100,mada_sales:200,visa_sales:50,mastercard_sales:25,amex_sales:5,coupons_sales:10,tamara_sales:20,other_sales:15,deposits:80,approved_expenses:10});
ok(result.total_sales_gross===425,'gross total matches all payment methods',result);
ok(result.network_total===280,'network total includes four card methods',result);
ok(result.noncash_withdrawals===45,'non-cash total includes coupons, Tamara, and other sales',result);
ok(result.closing_balance===1010,'cash balance follows the workbook equation',result);
ok(result.total_sales_net===369.57,'target-linked sales exclude VAT',result);

ok(cash.dateKey(46287)==='2026-09-22','converts Excel serial dates',cash.dateKey(46287));
ok(cash.validate({close_by:'employee',deposits:0},cash.calculate({}))===true,'accepts a close without a deposit sequence when there is no deposit');
let threw=false;try{cash.validate({close_by:'employee',deposits:100},cash.calculate({deposits:100}))}catch(error){threw=/تسلسل/.test(error.message)}
ok(threw,'requires a deposit sequence when a deposit is recorded');

console.log('Rakiza cash close tests passed:',pass);
