// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import PropTypes from 'prop-types';
import {StyleSheet, View} from 'react-native';

import ImageViewPort from '@components/image_viewport';
import {Client4} from '@mm-redux/client';
import {isDocument, isGif, isVideo} from '@utils/file';
import {getViewPortWidth, previewImageAtIndex} from '@utils/images';
import {preventDoubleTap} from '@utils/tap';

import FileAttachment from './file_attachment';

const MAX_VISIBLE_ROW_IMAGES = 4;

export default class FileAttachmentList extends ImageViewPort {
    static propTypes = {
        actions: PropTypes.shape({
            loadFilesForPostIfNecessary: PropTypes.func.isRequired,
        }).isRequired,
        canDownloadFiles: PropTypes.bool.isRequired,
        fileIds: PropTypes.array.isRequired,
        files: PropTypes.array,
        isFailed: PropTypes.bool,
        onLongPress: PropTypes.func,
        postId: PropTypes.string.isRequired,
        theme: PropTypes.object.isRequired,
        isReplyPost: PropTypes.bool,
    };

    static defaultProps = {
        files: [],
    };

    constructor(props) {
        super(props);

        this.items = [];
        this.filesForGallery = this.getFilesForGallery(props);

        this.buildGalleryFiles().then((results) => {
            this.galleryFiles = results;
        });
    }

    componentDidMount() {
        super.componentDidMount();
        const {files} = this.props;

        if (files.length === 0) {
            this.loadFilesForPost();
        }
    }

    componentDidUpdate(prevProps) {
        if (prevProps.files.length !== this.props.files.length) {
            this.filesForGallery = this.getFilesForGallery(this.props);
            this.buildGalleryFiles().then((results) => {
                this.galleryFiles = results;
            });
            this.loadFilesForPost();
        }
    }

    attachmentIndex = (fileId) => {
        return this.filesForGallery.findIndex((file) => file.id === fileId) || 0;
    };

    attachmentManifest = (attachments) => {
        return attachments.reduce((info, file) => {
            if (this.isImage(file)) {
                info.imageAttachments.push(file);
            } else {
                info.nonImageAttachments.push(file);
            }
            return info;
        }, {imageAttachments: [], nonImageAttachments: []});
    };

    buildGalleryFiles = async () => {
        const results = [];

        if (this.filesForGallery && this.filesForGallery.length) {
            for (let i = 0; i < this.filesForGallery.length; i++) {
                const file = this.filesForGallery[i];
                const caption = file.name;

                if (isDocument(file) || isVideo(file) || (!file.has_preview_image && !isGif(file))) {
                    results.push({
                        caption,
                        data: file,
                    });
                    continue;
                }

                let uri;
                if (file.localPath) {
                    uri = file.localPath;
                } else {
                    uri = Client4.getFileUrl(file.id);
                }

                results.push({
                    caption,
                    source: {uri},
                    data: file,
                });
            }
        }

        return results;
    };

    getFilesForGallery = (props) => {
        const manifest = this.attachmentManifest(props.files);
        const files = manifest.imageAttachments.concat(manifest.nonImageAttachments);
        const results = [];

        if (files && files.length) {
            files.forEach((file) => {
                results.push(file);
            });
        }

        return results;
    };

    handleCaptureRef = (ref, idx) => {
        this.items[idx] = ref;
    };

    handlePreviewPress = preventDoubleTap((idx) => {
        previewImageAtIndex(this.items, idx, this.galleryFiles);
    });

    isImage = (file) => (file.has_preview_image || isGif(file));

    isSingleImage = (files) => (files.length === 1 && this.isImage(files[0]));

    loadFilesForPost = async () => {
        await this.props.actions.loadFilesForPostIfNecessary(this.props.postId);
    }

    renderItems = (items, moreImagesCount, includeGutter = false) => {
        const {canDownloadFiles, isReplyPost, onLongPress, theme} = this.props;
        const isSingleImage = this.isSingleImage(items);
        let nonVisibleImagesCount;
        let container = styles.container;
        const containerWithGutter = [container, styles.gutter];

        return items.map((file, idx) => {
            const f = {
                caption: file.name,
                data: file,
            };

            if (moreImagesCount && idx === MAX_VISIBLE_ROW_IMAGES - 1) {
                nonVisibleImagesCount = moreImagesCount;
            }

            if (idx !== 0 && includeGutter) {
                container = containerWithGutter;
            }

            return (
                <View
                    style={container}
                    key={file.id}
                >
                    <FileAttachment
                        key={file.id}
                        canDownloadFiles={canDownloadFiles}
                        file={f}
                        id={file.id}
                        index={this.attachmentIndex(file.id)}
                        onCaptureRef={this.handleCaptureRef}
                        onPreviewPress={this.handlePreviewPress}
                        onLongPress={onLongPress}
                        theme={theme}
                        isSingleImage={isSingleImage}
                        nonVisibleImagesCount={nonVisibleImagesCount}
                        wrapperWidth={getViewPortWidth(isReplyPost, this.hasPermanentSidebar())}
                    />
                </View>
            );
        });
    };

    renderImageRow = (images) => {
        if (images.length === 0) {
            return null;
        }

        const {isReplyPost} = this.props;
        const visibleImages = images.slice(0, MAX_VISIBLE_ROW_IMAGES);
        const portraitPostWidth = getViewPortWidth(isReplyPost, this.hasPermanentSidebar());

        let nonVisibleImagesCount;
        if (images.length > MAX_VISIBLE_ROW_IMAGES) {
            nonVisibleImagesCount = images.length - MAX_VISIBLE_ROW_IMAGES;
        }

        return (
            <View style={[styles.row, {width: portraitPostWidth}]}>
                { this.renderItems(visibleImages, nonVisibleImagesCount, true) }
            </View>
        );
    };

    render() {
        const {canDownloadFiles, fileIds, files, isFailed} = this.props;

        if (!files.length && fileIds.length > 0) {
            return fileIds.map((id, idx) => (
                <FileAttachment
                    key={id}
                    canDownloadFiles={canDownloadFiles}
                    file={{loading: true}}
                    id={id}
                    index={idx}
                    theme={this.props.theme}
                />
            ));
        }

        const manifest = this.attachmentManifest(files);

        return (
            <View style={[isFailed && styles.failed]}>
                {this.renderImageRow(manifest.imageAttachments)}
                {this.renderItems(manifest.nonImageAttachments)}
            </View>
        );
    }
}

const styles = StyleSheet.create({
    row: {
        flex: 1,
        flexDirection: 'row',
        marginTop: 5,
    },
    container: {
        flex: 1,
    },
    gutter: {
        marginLeft: 8,
    },
    failed: {
        opacity: 0.5,
    },
});
