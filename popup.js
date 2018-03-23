var PopupData = {};

var Popup = function Popup(params){
    this.id = params.id;
    this.params = params;
    this.cachedScrollTop = 0;
    this.iosCarretBugfixActivated = false;

    this.$ = jq_144;
    this.popup = this.$('#' + this.id + ' > div');
    this.button = this.$('#' + this.id + ' > a');
    this.closeButton = this.popup.find('a.close');
    this.form = this.popup.find('form');
    this.confirmation = this.popup.find('.confirmation');

    this.createCallback();
    this.init();
};

Popup.prototype.fixPosition = function(returnNumber){
    this.popup.css('margin-top', 0);
    var page = this.$(window).height();
    var popup = this.popup.height() + parseInt(this.popup.css('padding-left')) * 2;

    if(returnNumber){
        return (page-popup)/2;
    } else {
        this.popup.css('margin-top', (page-popup)/2 + 'px');
    }
};

Popup.prototype.scrollTopGet = function () {
    return ( window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0 );
};

Popup.prototype.iosWebKitFix = function () {
    if ( LPG.utils.urlData.getValue( 'js_debug' ) !== '' ) {
        alert( 'iosWebKitFix called' );
    }
    this.cachedScrollTop = this.scrollTopGet();
    this.$( window ).scrollTop( 0 );
    this.$( 'html' ).addClass( 'iosInputsFix' );
    // this.$( 'body' ).css( { overflow: 'hidden' } );
    this.iosCarretBugfixActivated = true;
};

Popup.prototype.iosWebKitFixRollback = function () {
    if ( !this.iosCarretBugfixActivated ) { return; }
    this.$( window ).scrollTop( this.cachedScrollTop );
    this.$( 'html' ).removeClass( 'iosInputsFix' );
    // this.$( 'body' ).css( { overflow: '' } );
    this.iosCarretBugfixActivated = false;
    this.cachedScrollTop = 0;
};

Popup.prototype.iosWebKitCheck = function () {
    var md = new MobileDetect( navigator.userAgent || navigator.vendor || window.opera );
    if ( LPG.utils.urlData.getValue( 'js_debug' ) !== '' && LPG.utils.urlData.getValue( 'iosch' ) !== '' ) {
        document.writeln( 'md.os() :: ' + md.os() );
        document.writeln( '\nmd.is( \'WebKit\' ) :: ' + md.is( 'WebKit' ) );
        document.writeln( '\nmd.version( \'iOS\' ) :: ' + md.version( 'iOS' ) );
    }
    if ( md.os() === 'iOS' && md.is( 'WebKit' ) && ( parseInt( md.version( 'iOS' ) ) >= 11 ) ) {
        this.iosWebKitFix();
    }
};

Popup.prototype.init = function(){

    this.$('#loading_bar').css('z-index', 1950).appendTo('body');
    this.popup.appendTo('body');
    var overlay = this.overlay = this.popup.wrap('<div class="widget popup overlay"/>').parent();
    overlay.attr('id', 'overlay-' + this.id);

    var that = this;
    this.button.click(function(e){
        if(e.originalEvent){
            that.animation = null;
        } else {
            that.animation = that.params.showActions.animation;
        }
        e.preventDefault();
        that.confirmation.removeClass('show');
        that.form.show();

        that.iosWebKitCheck();

        that.doAnimate();
    });

    this.closeButton.click(function(e){
        e.preventDefault();
        that.iosWebKitFixRollback();
        overlay.hide();
    });

    overlay.find('input[type="submit"]')
        .removeAttr('disabled');

    this.addCustomShowListeners();
    this.addSubmitListener();
    this.addPrivacyListeners();
};

Popup.prototype.doAnimate = function(){
    var overlay = this.overlay;
    var anim = false;
    if(!this.animation){
        overlay.show();
    } else if(this.animation == 'center'){
        overlay.fadeIn(1000);
    } else if(this.animation == 'fadeTop'){
        this.popup.css('top', '-700px');
        anim = true;
    } else if(this.animation == 'fadeLeft'){
        this.popup.css('left', '-1500px');
        anim = true;
    } else if(this.animation == 'fadeBottom'){
        this.popup.css('top', '700px');
        anim = true;
    } else if(this.animation == 'fadeRight'){
        this.popup.css('left', '1500px');
        anim = true;
    }
    if(anim){
        overlay.fadeIn(1000);
        this.popup.animate({
            'top' : '0',
            'left': '0'
        }, 1000);
    }
    this.fixPosition();
};

Popup.prototype.addPrivacyListeners = function () {
    var self = this;
    if ( !this.params.isShowPrivacyCheckbox ) { return false; }
    this.form.find( '.privacyPolicy' ).on( 'change', function () {
        self.form.find( 'input[type="submit"]' ).prop( 'disabled', !this.checked );
    } );
};

Popup.prototype.addCustomShowListeners = function(){
    if(!this.params.showActions || !this.params.showActions.showEvent){
        return;
    }
    var self = this;
    var event = this.params.showActions.showEvent;
    var wasShown = false;

    if(event == 'timer'){
        setTimeout(function(){
            self.button.click();
        }, this.params.showActions.seconds * 1000);
    } else if(event == 'scroll'){
        this.$(window).scroll(function(e){
            if(wasShown){
                return;
            }
            if ( self.scrollTopGet() > self.params.showActions.pixels ) {
                wasShown = true;
                self.button.click();
            }
        });
    } else if(event == 'close'){
        var wasOnPage = false;
        this.$('body').mousemove(function(e){
            if(wasShown){
                return;
            }
            if(e.pageY > 100){
                wasOnPage = true;
            }
            if( wasOnPage && e.pageY < ( 10 + self.$(window).scrollTop() ) ){
                wasShown = true;
                self.button.click();
            }
        });
    }
};

Popup.prototype.addSubmitListener = function(){
	var rev = document.location.search.match(/rev=(\d+)/) && RegExp.$1;
	var that = this;
	var url = "/var/%@/form/action/".replace('%@', window.variantId) +
		"?form_id=" + this.id.split('-')[1] + "&d=" + location.hostname + (rev ? '&rev='+rev : '');
	var isPayment = this.form.find('div[name="is_payment_lead"]')[0];
	var send_form = this.form;
	if (isPayment) {
		url += "&is_payment_lead=true";
		window.paymentProcess = function(data) {
			var d = send_form.find('div[name=paymentSettings]')[0].innerText.replace(/&quot;/g, '"');
			var paymentSettings = JSON.parse(d);
			landBilling.pay(paymentSettings, data.lead_id);
			setTimeout(function() {
				jq_144('#loading_bar').fadeOut();
			}, 100);
		};
	}
	this.url = url;
	this.form.attr("action", url + "&callback=" + this.callbackName);
	this.form.find('input:not([type="submit"]),textarea').each(function(){
		var $this = that.$(this);
		var placeholder = $this.attr('placeholder');
		if (placeholder) {
			placeholder = placeholder.replace('*', '');
		}
		var name = $this.attr('rel')+ ':' + placeholder;
		$this.attr('name', name);
    });

    if(this.params.version && this.params.version == '2'){
        this.form.submit(function(e){
            e.preventDefault();
            // e.stopImmediatePropagation();/* TODO: заменить .submit на .one , а функцию-слушатель сохранять в отдельное свойство для удобства повторного навешивания */
            document.activeElement.blur();
            var error = that.validate();
            setTimeout(function() {
                if(error){
                    if (error.field) error.field.focus();
                    alert(error.text || LT['field_must_be_entered'].replace('%@', error.label));
                    return false;
                } else {
                    that.submit();
                }
                that.$('#loading_bar').fadeIn();
            }, 10);
        });
    } else {
		this.form.submit(function(e){
			e.preventDefault();
			// e.stopImmediatePropagation();
			var error = that.validate();
			if(error){
				error.field.focus();
				alert(error.text || LT['field_must_be_entered'].replace('%@', error.label));
				return false;
			} else {
				that.submit();
			}
		});
    }
};

Popup.prototype.createCallback = function(){
    var callbackName = this.id.replace('-', '') + 'Callback';
    var that = this;
    window[callbackName] = function(data){
        jq_144('#loading_bar').fadeOut();
        if(!data){
            alert(LT['error_sending_data_try_latter']);
            return;
        }
        if(data.success){
            that.afterSubmit();
        } else {
            alert(data["errorMessage"]);
        }
    };
    this.callbackName = callbackName;
};

Popup.prototype.validate = function(){
	var error;
	var $ = this.$;
	var isDublicate = true;

	this.form.find('input:not([type="submit"]),textarea').each(function(){

		var name = this.name;
		var value = this.value;
		if (PopupData[name] != value) {
			isDublicate = false;
			PopupData[name] = value;
		}

        if(error){
            return;
        }
        if($(this).attr('data-required') && this.value.length < 1){
            error = {
                field: this,
                label: $(this).attr('placeholder').replace('*', '')
            };
        }
        if(this.value.length > 0 &&
            $(this).attr('rel') == 'email' &&
            !/^[A-Z0-9._+-]+@[A-Z0-9.-]+\.[A-Z]{2,6}$/i.test(this.value)){
            error = {
                field: this,
                text: LT['enter_valid_email']
            };
        }
    });
	if (isDublicate) {
		error = {
			field: null,
			text: LT['second_send_deny']
		};
	}
    return error;
};

Popup.prototype.getValues = function(){
    var r = [];
    this.form.find('input:not([type="submit"]),textarea').each(function(){
        var $this = jq_144( this );
        var placeholder = $this.attr( 'placeholder' );
        if (placeholder) {
			placeholder = placeholder.replace( '*', '' );
		}
        r.push({
            role: $this.attr( 'rel' ),
            label: $this.data( 'label' ) || placeholder,
            value: this.value
        });
    });
    return r;
};

Popup.prototype.submit = function(){
    var that = this;
    window.processSuccess = function( errors ) {
        if ( typeof errors.error_msg !== 'undefined' ) {
            alert( errors.error_msg );
        } else {
            that.afterSubmit();
        }
    };
    this.$('#loading_bar').fadeIn();
    this.$.ajax({
        type: "POST",
        url: this.url,
        data: JSON.stringify(this.getValues()),
        contentType: 'application/json',
        success: function(response){
            var jsStr = that.$.trim( response.replace( /(<([^>]+)>)/gmi, '' ) ).replace( /\n/, ' ' ),
                iframe = document.createElement( 'iframe' );

            that.$( '#lp_form_target' ).remove();
            iframe.id = 'lp_form_target';
            iframe.name = 'lp_form_target';
            iframe.style.cssText = 'width:0; height:0; border: 0;';
            iframe.src = 'javascript:' + jsStr;
            document.getElementById( 'preview' ).appendChild( iframe );
        },
        error: function(){
            alert(LT['error_sending_data_try_latter'])
        },
        complete: function(){
            jq_144('#loading_bar').fadeOut();
        }
    })
};

Popup.prototype.afterSubmit = function(){
    if(this.params.action === 'message'){
        this.form.hide();
        this.confirmation.addClass('show');
    } else if(this.params.action === 'url'){
        location.href = this.params['action-url'];
    } else if(this.params.action === 'ty'){
        location.href = this.params['action-ty'];
    }
    this.iosWebKitFixRollback();
};

widget.init('popup', Popup);
