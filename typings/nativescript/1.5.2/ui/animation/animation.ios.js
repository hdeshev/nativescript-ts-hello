var common = require("./animation-common");
var trace = require("trace");
var enums = require("ui/enums");
global.moduleMerge(common, exports);
var _transform = "_transform";
var _skip = "_skip";
var FLT_MAX = 340282346638528859811704183484516925440.000000;
var AnimationDelegateImpl = (function (_super) {
    __extends(AnimationDelegateImpl, _super);
    function AnimationDelegateImpl() {
        _super.apply(this, arguments);
    }
    AnimationDelegateImpl.new = function () {
        return _super.new.call(this);
    };
    AnimationDelegateImpl.prototype.initWithFinishedCallback = function (finishedCallback) {
        this._finishedCallback = finishedCallback;
        return this;
    };
    AnimationDelegateImpl.prototype.animationWillStart = function (animationID, context) {
        trace.write("AnimationDelegateImpl.animationWillStart, animationID: " + animationID, trace.categories.Animation);
    };
    AnimationDelegateImpl.prototype.animationDidStop = function (animationID, finished, context) {
        trace.write("AnimationDelegateImpl.animationDidStop, animationID: " + animationID + ", finished: " + finished, trace.categories.Animation);
        if (this._finishedCallback) {
            var cancelled = !finished;
            this._finishedCallback(cancelled);
        }
    };
    AnimationDelegateImpl.ObjCExposedMethods = {
        "animationWillStart": { returns: interop.types.void, params: [NSString, NSObject] },
        "animationDidStop": { returns: interop.types.void, params: [NSString, NSNumber, NSObject] }
    };
    return AnimationDelegateImpl;
})(NSObject);
var Animation = (function (_super) {
    __extends(Animation, _super);
    function Animation(animationDefinitions, playSequentially) {
        _super.call(this, animationDefinitions, playSequentially);
        trace.write("Non-merged Property Animations: " + this._propertyAnimations.length, trace.categories.Animation);
        this._mergedPropertyAnimations = Animation._mergeAffineTransformAnimations(this._propertyAnimations);
        trace.write("Merged Property Animations: " + this._mergedPropertyAnimations.length, trace.categories.Animation);
        var that = this;
        var animationFinishedCallback = function (cancelled) {
            if (that._playSequentially) {
                if (cancelled) {
                    that._rejectAnimationFinishedPromise();
                }
                else {
                    that._resolveAnimationFinishedPromise();
                }
            }
            else {
                if (cancelled) {
                    that._cancelledAnimations++;
                }
                else {
                    that._finishedAnimations++;
                }
                if (that._cancelledAnimations > 0 && (that._cancelledAnimations + that._finishedAnimations) === that._mergedPropertyAnimations.length) {
                    trace.write(that._cancelledAnimations + " animations cancelled.", trace.categories.Animation);
                    that._rejectAnimationFinishedPromise();
                }
                else if (that._finishedAnimations === that._mergedPropertyAnimations.length) {
                    trace.write(that._finishedAnimations + " animations finished.", trace.categories.Animation);
                    var i;
                    var len = that._propertyAnimations.length;
                    var a;
                    for (i = 0; i < len; i++) {
                        a = that._propertyAnimations[i];
                        switch (a.property) {
                            case common.Properties.translate:
                                a.target.translateX = a.value.x;
                                a.target.translateY = a.value.y;
                                break;
                            case common.Properties.rotate:
                                a.target.rotate = a.value;
                                break;
                            case common.Properties.scale:
                                a.target.scaleX = a.value.x;
                                a.target.scaleY = a.value.y;
                                break;
                        }
                    }
                    for (i = 0; i < len; i++) {
                        a = that._propertyAnimations[i];
                        var errorMessage = _getTransformMismatchErrorMessage(a.target);
                        if (errorMessage) {
                            throw new Error(errorMessage);
                        }
                    }
                    that._resolveAnimationFinishedPromise();
                }
            }
        };
        this._iOSAnimationFunction = Animation._createiOSAnimationFunction(this._mergedPropertyAnimations, 0, this._playSequentially, animationFinishedCallback);
    }
    Animation.prototype.play = function () {
        var animationFinishedPromise = _super.prototype.play.call(this);
        this._finishedAnimations = 0;
        this._cancelledAnimations = 0;
        this._iOSAnimationFunction();
        return animationFinishedPromise;
    };
    Animation.prototype.cancel = function () {
        _super.prototype.cancel.call(this);
        var i = 0;
        var length = this._mergedPropertyAnimations.length;
        for (; i < length; i++) {
            this._mergedPropertyAnimations[i].target._nativeView.layer.removeAllAnimations();
            if (this._mergedPropertyAnimations[i]._propertyResetCallback) {
                this._mergedPropertyAnimations[i]._propertyResetCallback();
            }
        }
    };
    Animation.prototype._resolveAnimationCurve = function (curve) {
        switch (curve) {
            case enums.AnimationCurve.easeIn:
                trace.write("Animation curve resolved to UIViewAnimationCurve.UIViewAnimationCurveEaseIn.", trace.categories.Animation);
                return UIViewAnimationCurve.UIViewAnimationCurveEaseIn;
            case enums.AnimationCurve.easeOut:
                trace.write("Animation curve resolved to UIViewAnimationCurve.UIViewAnimationCurveEaseOut.", trace.categories.Animation);
                return UIViewAnimationCurve.UIViewAnimationCurveEaseOut;
            case enums.AnimationCurve.easeInOut:
                trace.write("Animation curve resolved to UIViewAnimationCurve.UIViewAnimationCurveEaseInOut.", trace.categories.Animation);
                return UIViewAnimationCurve.UIViewAnimationCurveEaseInOut;
            case enums.AnimationCurve.linear:
                trace.write("Animation curve resolved to UIViewAnimationCurve.UIViewAnimationCurveLinear.", trace.categories.Animation);
                return UIViewAnimationCurve.UIViewAnimationCurveLinear;
            default:
                trace.write("Animation curve resolved to original: " + curve, trace.categories.Animation);
                return curve;
        }
    };
    Animation._createiOSAnimationFunction = function (propertyAnimations, index, playSequentially, finishedCallback) {
        return function (cancelled) {
            if (cancelled && finishedCallback) {
                trace.write("Animation " + (index - 1).toString() + " was cancelled. Will skip the rest of animations and call finishedCallback(true).", trace.categories.Animation);
                finishedCallback(cancelled);
                return;
            }
            var animation = propertyAnimations[index];
            var nativeView = animation.target._nativeView;
            var nextAnimationCallback;
            var animationDelegate;
            if (index === propertyAnimations.length - 1) {
                animationDelegate = AnimationDelegateImpl.new().initWithFinishedCallback(finishedCallback);
            }
            else {
                nextAnimationCallback = Animation._createiOSAnimationFunction(propertyAnimations, index + 1, playSequentially, finishedCallback);
                animationDelegate = AnimationDelegateImpl.new().initWithFinishedCallback(playSequentially ? nextAnimationCallback : finishedCallback);
            }
            trace.write("UIView.beginAnimationsContext(" + index + "): " + common.Animation._getAnimationInfo(animation), trace.categories.Animation);
            UIView.animateKeyframesWithDurationDelayOptionsAnimationsCompletion(1, 0, UIViewKeyframeAnimationOptions.UIViewKeyframeAnimationOptionBeginFromCurrentState, function () {
                UIView.addKeyframeWithRelativeStartTimeRelativeDurationAnimations(0, 1, function () {
                    if (animationDelegate) {
                        UIView.setAnimationDelegate(animationDelegate);
                        UIView.setAnimationWillStartSelector("animationWillStart");
                        UIView.setAnimationDidStopSelector("animationDidStop");
                    }
                    if (animation.duration !== undefined) {
                        UIView.setAnimationDuration(animation.duration / 1000.0);
                    }
                    else {
                        UIView.setAnimationDuration(0.3);
                    }
                    if (animation.delay !== undefined) {
                        UIView.setAnimationDelay(animation.delay / 1000.0);
                    }
                    if (animation.iterations !== undefined) {
                        if (animation.iterations === Number.POSITIVE_INFINITY) {
                            UIView.setAnimationRepeatCount(FLT_MAX);
                        }
                        else {
                            UIView.setAnimationRepeatCount(animation.iterations - 1);
                        }
                    }
                    if (animation.curve !== undefined) {
                        UIView.setAnimationCurve(animation.curve);
                    }
                    var originalValue;
                    switch (animation.property) {
                        case common.Properties.opacity:
                            originalValue = animation.target.opacity;
                            animation._propertyResetCallback = function () { animation.target.opacity = originalValue; };
                            animation.target.opacity = animation.value;
                            break;
                        case common.Properties.backgroundColor:
                            originalValue = animation.target.backgroundColor;
                            animation._propertyResetCallback = function () { animation.target.backgroundColor = originalValue; };
                            animation.target.backgroundColor = animation.value;
                            break;
                        case _transform:
                            originalValue = nativeView.transform;
                            animation._propertyResetCallback = function () { nativeView.transform = originalValue; };
                            nativeView.transform = Animation._createNativeAffineTransform(animation);
                            break;
                        default:
                            throw new Error("Cannot animate " + animation.property);
                            break;
                    }
                });
            }, null);
            trace.write("UIView.commitAnimations " + index, trace.categories.Animation);
            if (!playSequentially && nextAnimationCallback) {
                nextAnimationCallback();
            }
        };
    };
    Animation._createNativeAffineTransform = function (animation) {
        var view = animation.target;
        var value = animation.value;
        trace.write("Creating native affine transform. Curent transform is: " + NSStringFromCGAffineTransform(view._nativeView.transform), trace.categories.Animation);
        var result = CGAffineTransformIdentity;
        trace.write("Identity: " + NSStringFromCGAffineTransform(result), trace.categories.Animation);
        if (value[common.Properties.translate] !== undefined) {
            result = CGAffineTransformTranslate(result, value[common.Properties.translate].x, value[common.Properties.translate].y);
        }
        else {
            result = CGAffineTransformTranslate(result, view.translateX, view.translateY);
        }
        trace.write("After translate: " + NSStringFromCGAffineTransform(result), trace.categories.Animation);
        if (value[common.Properties.rotate] !== undefined) {
            result = CGAffineTransformRotate(result, value[common.Properties.rotate] * Math.PI / 180);
        }
        else {
            result = CGAffineTransformRotate(result, view.rotate * Math.PI / 180);
        }
        trace.write("After rotate: " + NSStringFromCGAffineTransform(result), trace.categories.Animation);
        if (value[common.Properties.scale] !== undefined) {
            result = CGAffineTransformScale(result, value[common.Properties.scale].x, value[common.Properties.scale].y);
        }
        else {
            result = CGAffineTransformScale(result, view.scaleX, view.scaleY);
        }
        trace.write("After scale: " + NSStringFromCGAffineTransform(result), trace.categories.Animation);
        return result;
    };
    Animation._isAffineTransform = function (property) {
        return property === _transform
            || property === common.Properties.translate
            || property === common.Properties.rotate
            || property === common.Properties.scale;
    };
    Animation._canBeMerged = function (animation1, animation2) {
        var result = Animation._isAffineTransform(animation1.property) &&
            Animation._isAffineTransform(animation2.property) &&
            animation1.target === animation2.target &&
            animation1.duration === animation2.duration &&
            animation1.delay === animation2.delay &&
            animation1.iterations === animation2.iterations &&
            animation1.curve === animation2.curve;
        return result;
    };
    Animation._mergeAffineTransformAnimations = function (propertyAnimations) {
        var result = new Array();
        var i = 0;
        var j;
        var length = propertyAnimations.length;
        for (; i < length; i++) {
            if (propertyAnimations[i][_skip]) {
                continue;
            }
            if (!Animation._isAffineTransform(propertyAnimations[i].property)) {
                result.push(propertyAnimations[i]);
            }
            else {
                var newTransformAnimation = {
                    target: propertyAnimations[i].target,
                    property: _transform,
                    value: {},
                    duration: propertyAnimations[i].duration,
                    delay: propertyAnimations[i].delay,
                    iterations: propertyAnimations[i].iterations
                };
                newTransformAnimation.value[propertyAnimations[i].property] = propertyAnimations[i].value;
                trace.write("Created new transform animation: " + common.Animation._getAnimationInfo(newTransformAnimation), trace.categories.Animation);
                j = i + 1;
                if (j < length) {
                    for (; j < length; j++) {
                        if (Animation._canBeMerged(propertyAnimations[i], propertyAnimations[j])) {
                            trace.write("Merging animations: " + common.Animation._getAnimationInfo(newTransformAnimation) + " + " + common.Animation._getAnimationInfo(propertyAnimations[j]) + ";", trace.categories.Animation);
                            newTransformAnimation.value[propertyAnimations[j].property] = propertyAnimations[j].value;
                            propertyAnimations[j][_skip] = true;
                        }
                    }
                }
                result.push(newTransformAnimation);
            }
        }
        return result;
    };
    return Animation;
})(common.Animation);
exports.Animation = Animation;
function _getTransformMismatchErrorMessage(view) {
    var result = CGAffineTransformIdentity;
    result = CGAffineTransformTranslate(result, view.translateX, view.translateY);
    result = CGAffineTransformRotate(result, view.rotate * Math.PI / 180);
    result = CGAffineTransformScale(result, view.scaleX, view.scaleY);
    var viewTransform = NSStringFromCGAffineTransform(result);
    var nativeTransform = NSStringFromCGAffineTransform(view._nativeView.transform);
    if (viewTransform !== nativeTransform) {
        return "View and Native transforms do not match. View: " + viewTransform + "; Native: " + nativeTransform;
    }
    return undefined;
}
exports._getTransformMismatchErrorMessage = _getTransformMismatchErrorMessage;
