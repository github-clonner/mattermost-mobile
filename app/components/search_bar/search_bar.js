// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {
    Animated,
    InteractionManager,
    Keyboard,
    TouchableWithoutFeedback,
    StyleSheet,
    View,
    Platform,
} from 'react-native';
import {intlShape} from 'react-intl';

import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import EvilIcon from 'react-native-vector-icons/EvilIcons';

import {SearchBar} from 'react-native-elements';

import {memoizeResult} from '@mm-redux/utils/helpers';

import CustomPropTypes from 'app/constants/custom_prop_types';

export default class Search extends PureComponent {
    static propTypes = {
        onBlur: PropTypes.func,
        onFocus: PropTypes.func,
        onSearchButtonPress: PropTypes.func,
        onChangeText: PropTypes.func,
        onCancelButtonPress: PropTypes.func,
        onSelectionChange: PropTypes.func,
        backgroundColor: PropTypes.string,
        placeholderTextColor: PropTypes.string,
        titleCancelColor: PropTypes.string,
        tintColorSearch: PropTypes.string,
        tintColorDelete: PropTypes.string,
        selectionColor: PropTypes.string,
        inputStyle: CustomPropTypes.Style,
        cancelButtonStyle: CustomPropTypes.Style,
        autoFocus: PropTypes.bool,
        placeholder: PropTypes.string,
        cancelTitle: PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.object,
        ]),
        returnKeyType: PropTypes.string,
        keyboardType: PropTypes.string,
        autoCapitalize: PropTypes.string,
        inputHeight: PropTypes.number,
        editable: PropTypes.bool,
        blurOnSubmit: PropTypes.bool,
        keyboardShouldPersist: PropTypes.bool,
        value: PropTypes.string,
        keyboardAppearance: PropTypes.string,
        showArrow: PropTypes.bool,
        searchBarRightMargin: PropTypes.number,
        leftComponent: PropTypes.element,
        searchIconSize: PropTypes.number,
        backArrowSize: PropTypes.number,
        deleteIconSize: PropTypes.number,
        showCancel: PropTypes.bool,
        containerHeight: PropTypes.number,
    };

    static contextTypes = {
        intl: intlShape,
    };

    static defaultProps = {
        onSelectionChange: () => true,
        onBlur: () => true,
        editable: true,
        blurOnSubmit: false,
        keyboardShouldPersist: false,
        placeholderTextColor: 'grey',
        value: '',
        showArrow: false,
        showCancel: true,
        searchIconSize: 24,
        backArrowSize: 24,
        deleteIconSize: 20,
        searchBarRightMargin: 0,
        returnKeyType: 'search',
        keyboardType: 'default',
        containerHeight: 40,
    };

    constructor(props) {
        super(props);
        this.state = {
            leftComponentWidth: 0,
        };

        this.leftComponentAnimated = new Animated.Value(0);
        this.searchContainerAnimated = new Animated.Value(0);
    }

    setSearchContainerRef = (ref) => {
        this.searchContainerRef = ref;
    }

    setInputKeywordRef = (ref) => {
        this.inputKeywordRef = ref;
    }

    blur = () => {
        this.inputKeywordRef.blur();
    };

    focus = () => {
        this.inputKeywordRef.focus();
    };

    onBlur = async () => {
        if (this.props.leftComponent) {
            await this.collapseAnimation();
        }
        this.props.onBlur();
    };

    onLeftComponentLayout = (event) => {
        const leftComponentWidth = event.nativeEvent.layout.width;
        this.setState({leftComponentWidth});
    };

    onSearch = async () => {
        if (this.props.keyboardShouldPersist === false) {
            await Keyboard.dismiss();
        }

        this.props.onSearchButtonPress(this.props.value);
    };

    onChangeText = (text) => {
        if (this.props.onChangeText) {
            this.props.onChangeText(text);
        }
    };

    onFocus = () => {
        InteractionManager.runAfterInteractions(async () => {
            if (this.props.leftComponent) {
                await this.expandAnimation();
            }

            if (this.props.onFocus) {
                this.props.onFocus();
            }
        });
    };

    onClear = () => {
        this.focus();
        this.props.onChangeText('', true);
    };

    onCancel = () => {
        Keyboard.dismiss();
        InteractionManager.runAfterInteractions(() => {
            if (this.props.onCancelButtonPress) {
                this.props.onCancelButtonPress();
            }
        });
    };

    onSelectionChange = (event) => {
        this.props.onSelectionChange(event);
    };

    expandAnimation = () => {
        return new Promise((resolve) => {
            Animated.parallel([
                Animated.timing(
                    this.leftComponentAnimated,
                    {
                        toValue: 100,
                        duration: 200,
                    },
                ),
                Animated.timing(
                    this.searchContainerAnimated,
                    {
                        toValue: this.state.leftComponentWidth * -1,
                        duration: 200,
                    },
                ),
            ]).start(resolve);
        });
    }

    collapseAnimation = () => {
        return new Promise((resolve) => {
            Animated.parallel([
                Animated.timing(
                    this.leftComponentAnimated,
                    {
                        toValue: 0,
                        duration: 200,
                    },
                ),
                Animated.timing(
                    this.searchContainerAnimated,
                    {
                        toValue: 0,
                        duration: 200,
                    },
                ),
            ]).start(resolve);
        });
    }

    render() {
        const {backgroundColor, inputHeight, inputStyle, placeholderTextColor, tintColorSearch, cancelButtonStyle, tintColorDelete, titleCancelColor, searchBarRightMargin, containerHeight} = this.props;
        const searchBarStyle = getSearchBarStyle(
            backgroundColor,
            cancelButtonStyle,
            inputHeight,
            inputStyle,
            placeholderTextColor,
            tintColorDelete,
            tintColorSearch,
            titleCancelColor,
            searchBarRightMargin,
            containerHeight,
        );
        const {intl} = this.context;

        let clearIcon = null;
        let searchIcon = null;
        let cancelIcon = null;

        if (Platform.OS === 'ios') {
            clearIcon = {
                type: 'ionicon',
                name: 'ios-close-circle',
                size: 17,
                color: searchBarStyle.clearIconColorIos,
            };

            searchIcon = (
                <EvilIcon
                    name='search'
                    size={24}
                    style={[
                        styles.fullWidth,
                        searchBarStyle.searchIcon,
                    ]}
                />
            );
        } else {
            searchIcon = this.props.showArrow ?
                (
                    <TouchableWithoutFeedback onPress={this.onCancel}>
                        <MaterialIcon
                            name='arrow-back'
                            size={this.props.backArrowSize}
                            color={searchBarStyle.clearIconColorAndroid}
                        />
                    </TouchableWithoutFeedback>
                ) :
                {
                    type: 'material',
                    size: this.props.searchIconSize,
                    color: searchBarStyle.searchIconColor,
                    name: 'search',
                };

            // Making sure the icon won't change depending on whether the input is in focus on Android devices
            cancelIcon = {
                type: 'material',
                size: 25,
                color: searchBarStyle.clearIconColorAndroid,
                name: 'arrow-back',
            };

            clearIcon = {
                type: 'material',
                size: this.props.deleteIconSize,
                color: searchBarStyle.clearIconColorAndroid,
                name: 'close',
            };
        }

        return (
            <View style={searchBarStyle.container}>
                {((this.props.leftComponent) ?
                    <Animated.View
                        style={{
                            right: this.leftComponentAnimated,
                        }}
                        onLayout={this.onLeftComponentLayout}
                    >
                        {this.props.leftComponent}
                    </Animated.View> :
                    null
                )}
                <Animated.View
                    style={[
                        styles.fullWidth,
                        searchBarStyle.searchBarWrapper,
                        {
                            marginLeft: this.searchContainerAnimated,
                        },
                    ]}
                >
                    <SearchBar
                        ref={this.setInputKeywordRef}
                        containerStyle={{
                            ...styles.searchContainer,
                            ...styles.fullWidth,
                            ...searchBarStyle.searchBarContainer,
                        }}
                        inputContainerStyle={{
                            ...styles.inputContainer,
                            ...searchBarStyle.inputContainer,
                        }}
                        inputStyle={{
                            ...styles.text,
                            ...styles.inputMargin,
                            ...searchBarStyle.inputStyle,
                        }}
                        leftIconContainerStyle={styles.leftIcon}
                        placeholder={this.props.placeholder || intl.formatMessage({id: 'search_bar.search', defaultMessage: 'Search'})}
                        placeholderTextColor={this.props.placeholderTextColor}
                        selectionColor={this.props.selectionColor}
                        autoCorrect={false}
                        blurOnSubmit={this.props.blurOnSubmit}
                        editable={this.props.editable}
                        cancelButtonTitle={this.props.cancelTitle || intl.formatMessage({id: 'mobile.post.cancel', defaultMessage: 'Cancel'})}
                        cancelButtonProps={{
                            buttonTextStyle: {
                                ...styles.text,
                                ...searchBarStyle.cancelButtonText,
                            },
                        }}
                        onChangeText={this.onChangeText}
                        onSubmitEditing={this.onSearch}
                        returnKeyType={this.props.returnKeyType}
                        keyboardType={this.props.keyboardType}
                        autoCapitalize={this.props.autoCapitalize}
                        onBlur={this.onBlur}
                        onFocus={this.onFocus}
                        onCancel={this.onCancel}
                        onClear={this.onClear}
                        onSelectionChange={this.onSelectionChange}
                        underlineColorAndroid='transparent'
                        enablesReturnKeyAutomatically={true}
                        keyboardAppearance={this.props.keyboardAppearance}
                        autoFocus={this.props.autoFocus}
                        showCancel={this.props.showCancel}
                        value={this.props.value}
                        platform={Platform.OS}
                        clearIcon={clearIcon}
                        searchIcon={searchIcon}
                        cancelIcon={cancelIcon}
                    />
                </Animated.View>
            </View>
        );
    }
}

const getSearchBarStyle = memoizeResult((
    backgroundColor,
    cancelButtonStyle,
    inputHeight,
    inputStyle,
    placeholderTextColor,
    tintColorDelete,
    tintColorSearch,
    titleCancelColor,
    searchBarRightMargin,
    containerHeight,
) => ({
    cancelButtonText: {
        ...cancelButtonStyle,
        color: titleCancelColor,
    },
    container: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        height: containerHeight,
        flex: 1,
    },
    clearIconColorIos: tintColorDelete || styles.defaultColor.color,
    clearIconColorAndroid: titleCancelColor || placeholderTextColor,
    inputStyle: {
        ...inputStyle,
        backgroundColor: 'transparent',
        height: inputHeight,
    },
    inputContainer: {
        backgroundColor: inputStyle.backgroundColor,
        height: inputHeight,
    },
    searchBarWrapper: {
        marginRight: searchBarRightMargin,
        height: Platform.select({
            ios: inputHeight || containerHeight - 10,
            android: inputHeight,
        }),
    },
    searchBarContainer: {
        backgroundColor,
    },
    searchIcon: {
        color: tintColorSearch || placeholderTextColor,
        top: 10,
    },
    searchIconColor: tintColorSearch || placeholderTextColor,
}));

const styles = StyleSheet.create({
    defaultColor: {
        color: 'grey',
    },
    fullWidth: {
        flex: 1,
    },
    inputContainer: {
        marginLeft: 0,
        borderRadius: Platform.select({
            ios: 2,
            android: 0,
        }),
    },
    inputMargin: {
        marginLeft: 4,
        paddingTop: 0,
        marginTop: Platform.select({
            ios: 0,
            android: 8,
        }),
    },
    leftIcon: {
        marginLeft: 4,
    },
    searchContainer: {
        paddingTop: 0,
        paddingBottom: 0,
        marginLeft: 0,
    },
    text: {
        fontSize: Platform.select({
            ios: 14,
            android: 15,
        }),
        color: '#fff',
    },
});
