/**
 * Патч для диалогового окна jquery-ui
 * В оригинальной функции существует бага, не позволяющая установить фокус вне окна (например на сторооние чаты/звонилки итд)
 */

$.ui.dialog.prototype._focusTabbable = function() {
	if (this.alreadyOpened) {
		return
	} else {
		this.alreadyOpened = true;
	}

	var hasFocus = this.element.find("[autofocus]");
	if ( !hasFocus.length ) {
		hasFocus = this.element.find(":tabbable");
	}
	if ( !hasFocus.length ) {
		hasFocus = this.uiDialogButtonPane.find(":tabbable");
	}
	if ( !hasFocus.length ) {
		hasFocus = this.uiDialogTitlebarClose.filter(":tabbable");
	}
	if ( !hasFocus.length ) {
		hasFocus = this.uiDialog;
	}
	hasFocus.eq( 0 ).focus();
};