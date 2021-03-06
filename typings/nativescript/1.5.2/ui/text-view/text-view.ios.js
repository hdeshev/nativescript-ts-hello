var common = require("./text-view-common");
var textBase = require("ui/text-base");
var enums = require("ui/enums");
global.moduleMerge(common, exports);
var UITextViewDelegateImpl = (function (_super) {
    __extends(UITextViewDelegateImpl, _super);
    function UITextViewDelegateImpl() {
        _super.apply(this, arguments);
    }
    UITextViewDelegateImpl.initWithOwner = function (owner) {
        var impl = UITextViewDelegateImpl.new();
        impl._owner = owner;
        return impl;
    };
    UITextViewDelegateImpl.prototype.textViewShouldBeginEditing = function (textView) {
        var owner = this._owner.get();
        if (owner) {
            owner._hideHint();
        }
        return true;
    };
    UITextViewDelegateImpl.prototype.textViewDidBeginEditing = function (textView) {
        var owner = this._owner.get();
        if (owner) {
            owner.style._updateTextDecoration();
            owner.style._updateTextTransform();
        }
    };
    UITextViewDelegateImpl.prototype.textViewDidEndEditing = function (textView) {
        var owner = this._owner.get();
        if (owner) {
            if (owner.updateTextTrigger === enums.UpdateTextTrigger.focusLost) {
                owner._onPropertyChangedFromNative(textBase.TextBase.textProperty, textView.text);
            }
            owner.dismissSoftInput();
            owner._refreshHintState(owner.hint, textView.text);
            owner.style._updateTextDecoration();
            owner.style._updateTextTransform();
        }
    };
    UITextViewDelegateImpl.prototype.textViewDidChange = function (textView) {
        var owner = this._owner.get();
        if (owner) {
            var range = textView.selectedRange;
            owner.style._updateTextDecoration();
            owner.style._updateTextTransform();
            textView.selectedRange = range;
            if (owner.updateTextTrigger === enums.UpdateTextTrigger.textChanged) {
                owner._onPropertyChangedFromNative(textBase.TextBase.textProperty, textView.text);
            }
        }
    };
    UITextViewDelegateImpl.ObjCProtocols = [UITextViewDelegate];
    return UITextViewDelegateImpl;
})(NSObject);
var TextView = (function (_super) {
    __extends(TextView, _super);
    function TextView() {
        _super.call(this);
        this._ios = new UITextView();
        if (!this._ios.font) {
            this._ios.font = UIFont.systemFontOfSize(12);
        }
        this._delegate = UITextViewDelegateImpl.initWithOwner(new WeakRef(this));
    }
    TextView.prototype.onLoaded = function () {
        _super.prototype.onLoaded.call(this);
        this._ios.delegate = this._delegate;
    };
    TextView.prototype.onUnloaded = function () {
        this._ios.delegate = null;
        _super.prototype.onUnloaded.call(this);
    };
    Object.defineProperty(TextView.prototype, "ios", {
        get: function () {
            return this._ios;
        },
        enumerable: true,
        configurable: true
    });
    TextView.prototype._onEditablePropertyChanged = function (data) {
        this._ios.editable = data.newValue;
    };
    TextView.prototype._onHintPropertyChanged = function (data) {
        this._refreshHintState(data.newValue, this.text);
    };
    TextView.prototype._onTextPropertyChanged = function (data) {
        _super.prototype._onTextPropertyChanged.call(this, data);
        this._refreshHintState(this.hint, data.newValue);
    };
    TextView.prototype._refreshHintState = function (hint, text) {
        if (hint && !text) {
            this._showHint(hint);
        }
        else {
            this._hideHint();
        }
    };
    TextView.prototype._showHint = function (hint) {
        this.ios.textColor = this.ios.textColor ? this.ios.textColor.colorWithAlphaComponent(0.22) : UIColor.blackColor().colorWithAlphaComponent(0.22);
        this.ios.text = hint + "";
        this.ios.isShowingHint = true;
    };
    TextView.prototype._hideHint = function () {
        this.ios.textColor = this.color ? this.color.ios : null;
        this.ios.text = this.text + "";
        this.ios.isShowingHint = false;
    };
    return TextView;
})(common.TextView);
exports.TextView = TextView;
