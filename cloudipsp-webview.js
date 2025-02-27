import React from 'react';
import {
    View,
} from 'react-native';
import { WebView } from 'react-native-webview';

import {Receipt} from './cloudipsp'

const addViewportMeta = `(${String(() => {
    const meta = document.createElement('meta');
    meta.setAttribute('content', 'width=device-width, user-scalable=0,');
    meta.setAttribute('name', 'viewport');
    const elementHead = document.getElementsByTagName('head');
    if (elementHead) {
        elementHead[0].appendChild(meta);
    } else {
        const head = document.createElement('head');
        head.appendChild(meta);
    }
})})();`;

export class CloudipspWebView extends React.Component {
    constructor(props) {
        super(props);
        this.state = {};
        this.urlStartPattern = 'http://secure-redirect.cloudipsp.com/submit/#';
    }

    __confirm__ = (baseUrl, html) => {
        if (this.onSuccess !== undefined) {
            throw new Error('CloudipspWebView already waiting for confirmation');
        }
        let state = {baseUrl: baseUrl, html: html};
        this.setState(state);
        return new Promise((onOk, onNotOk) => {
            this.onSuccess = onOk;
        });
    }

    render() {
        if (this.state.baseUrl === undefined) {
            return (<View />);
        } else {
            return (
                <WebView
                    style={{flex:1}}
                    ref='webView'
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                    scalesPageToFit={true}
                    source={{ baseUrl : this.state.baseUrl, html : this.state.html}}
                    injectedJavaScript={addViewportMeta}
                    onLoadStart={(event) => {
                        if (this.onSuccess !== undefined) {
                            let url = event.nativeEvent.url;
                            if (url.startsWith(this.urlStartPattern)) {
                                let jsonOfConfirmation = url.split(this.urlStartPattern)[1];
                                console.log('json of confirmation: '+jsonOfConfirmation);
                                var response;
                                try {
                                    response = JSON.parse(jsonOfConfirmation);
                                } catch (e) {
                                    response = JSON.parse(decodeURIComponent(jsonOfConfirmation));
                                }
                                let receipt = Receipt.__fromOrderData__(response.params);
                                this.setState({baseUrl : undefined, html : undefined}, () => {
                                    this.onSuccess(receipt);
                                    this.onSuccess = undefined;
                                });
                                this.refs.webView.goBack();
                            }
                        }
                    }}
                />
            );
        }
    }


}
