var landBilling = {
	isPaymentProcess: false,

	pay: function(data, leadId) {
		if (landBilling.isPaymentProcess) {
			return;
		}
		landBilling.isPaymentProcess = true;
		console.log('data:', data);
		landBilling.system[data.type](data, leadId);
	},

	paymentCreate: function (data, leadId, callback) {
		var amount = 0;
		data.items.forEach(function(product) {
			amount += +product.cost;
		});
		var csrf = jq_144.cookie('csrftoken');

		var xmlhttp = new XMLHttpRequest();   // new HttpRequest instance
		xmlhttp.open("POST", '/api/v1/landings/billing/payment/');
		xmlhttp.setRequestHeader('X-CSRFToken', csrf);
		xmlhttp.setRequestHeader("Content-Type", "application/json");

		xmlhttp.onload = function() {
			if (this.status < 300) {
				var response = JSON.parse(xmlhttp.responseText);
				callback(response);
			}
		};

		xmlhttp.send(JSON.stringify({
			"pay_system":	+data.pay_system,
			"variant":		window.variantId,
			"lead":			leadId || null,
			"amount":		amount,
			"success_url":	data.success_url,
			"fail_url":		data.fail_url,
			"products":		data.items	//JSON.stringify()
		}));
	},

	system: {
		tpay: function(data, leadId) {
			landBilling.paymentCreate(data, leadId, function(response){
				var payId = response['id'];
				localStorage['payment_' + payId + 'success_msg'] = data['success_message'];
				localStorage['payment_' + payId + 'fail_msg'] = data['fail_message'];
				document.location.href = response['payment_url'];
			});
		},

		robo: function(data, leadId) {
			landBilling.paymentCreate(data, leadId, function(response){
				console.log(response);
				var payId = response['id'];
				localStorage['payment_' + payId + 'success_msg'] = data['success_message'];
				localStorage['payment_' + payId + 'fail_msg'] = data['fail_message'];
				var form = document.createElement('FORM');
				form.action = response['payment_url'];
				form.style = "display:none;";
				form.method = "POST";
				var fields = response['payment_system_data'];
				var fieldNames = Object.keys(fields);
				for (var i =0; i<fieldNames.length; i++) {
					var fieldName = fieldNames[i];
					var el = document.createElement('INPUT');
					el.type = "hidden";
					el.name = fieldName;
					el.value = fields[fieldName];
					form.appendChild(el);
				}
				document.body.appendChild(form);
				form.submit();
			});
		},

		yandex: function(data, leadId) {
			/*
				<form shortcut="yamForm" class="dn" action="{{ M.data.params.yandex.apiDomain }}/eshop.xml" method="post">
					<input name="shopId" value="{{ M.data.params.yandex.shopId }}" type="hidden"/>
					<input name="scid" value="{{ M.data.params.yandex.scid }}" type="hidden"/>
					<input name="sum" value="{{ M.data.params.yandex.amount }}" type="hidden">
					<input name="orderNumber" value="{{ M.data.params.transactionId }}" type="hidden">
					<input name="cps_phone" value="{{ G.appInfo.account.phone }}" type="hidden">
					<input name="customerNumber" value="{{ G.appInfo.account.accountId }}" type="hidden"/>
					<input name="paymentType" value="SB" type="radio" checked/>
					<input name="shopSuccessURL" value="{{ M.data.params.successUrl }}" type="hidden"/>
					<input name="shopFailURL" value="{{ M.data.params.failUrl }}" type="hidden"/>
					<input id="" type="submit" value="Заплатить"/>
				</form>
			*/
			landBilling.paymentCreate(data, leadId, function(response){
				console.log(response);
				var payId = response['id'];
				localStorage['payment_' + payId + 'success_msg'] = data['success_message'];
				localStorage['payment_' + payId + 'fail_msg'] = data['fail_message'];
				var form = document.createElement('FORM');
				form.action = response['payment_url'];
				form.style = "display:none;";
				form.method = "POST";
				var fields = response['payment_system_data'];
				var fieldNames = Object.keys(fields);
				for (var i =0; i<fieldNames.length; i++) {
					var fieldName = fieldNames[i];
					var el = document.createElement('INPUT');
					el.type = "hidden";
					el.name = fieldName;
					el.value = fields[fieldName];
					form.appendChild(el);
				}
				document.body.appendChild(form);
				form.submit();
			});

		}
	},

	success: function(payId) {
		console.log('payId:', payId);
		var msg = localStorage['payment_' + payId + 'success_msg'];
		landBilling.showMessage(msg || LT['success_pay_default_msg']);
	},

	fail: function(payId) {
		var msg = localStorage['payment_' + payId + 'fail_msg'];
		landBilling.showMessage(msg || LT['fail_pay_default_msg']);
	},

	showMessage: function(msg) {
		if (jq_144('#form_submit_message').length === 0) {
			jq_144('<div id="form_submit_message" />').append('<div class="internal"></div>').appendTo(jq_144('body'));
			jq_144('#form_submit_message .internal').html(msg);
			jq_144('#form_submit_message').overlay({
				oneInstance: true,
				onBeforeLoad: function() {
					var $msg = jq_144('#form_submit_message');
					var $screen = jq_144(window);
					$msg.css('left', Math.max(($screen.width() - $msg.width()) / 2, 0));
				},
				onClose: function() {
					jq_144('#loading_bar').fadeOut();
				},
				left: 'center',
				load: true,
				closeOnEsc: false,
				closeOnClick: false
			});
		}
	}
};

(function() {
	var getParams = document.location.search.substr(1);
	var params = {};
	getParams.split('&').forEach(function(pair){
		var value = pair.split('=');
		params[value[0]] = value[1];
	});
	if (params['lb_success']) {
		landBilling.success(params['payment_id']);
	} else if (params['lb_fail']) {
		landBilling.fail(params['payment_id']);
	}
})();
