// @flow
import { getAppBaseUrl } from '../facial-recognition/functions';

import { FACE_BOX_EVENT_TYPE, DETECT_FACE_BOX } from './constants';
import logger from './logger';

/**
 * Sends the face box to all the other participants.
 *
 * @param {Object} conference - The current conference.
 * @param  {Object} faceBox - Face box to be sent.
 * @returns {void}
 */
export function sendFaceBoxToParticipants(
        conference: Object,
        faceBox: Object
): void {
    try {
        conference.sendEndpointMessage('', {
            type: FACE_BOX_EVENT_TYPE,
            faceBox
        });
    } catch (err) {
        logger.warn('Could not broadcast the face box to the other participants', err);
    }
}

/**
 * Sends the image data a canvas from the track in the image capture to the face centering worker.
 *
 * @param {Worker} worker - Face centering worker.
 * @param {Object} imageCapture - Image capture that contains the current track.
 * @param {number} threshold - Movement threshold as percentage for sharing face coordinates.
 * @param {boolean} isHorizontallyFlipped - Indicates whether the image is horizontally flipped.
 * @returns {Promise<void>}
 */
export async function sendDataToWorker(
        worker: Worker,
        imageCapture: Object,
        threshold: number = 10,
        isHorizontallyFlipped = true
): Promise<void> {
    if (imageCapture === null || imageCapture === undefined) {
        return;
    }

    let imageBitmap;

    try {
        imageBitmap = await imageCapture.grabFrame();
    } catch (err) {
        logger.warn(err);

        return;
    }

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    canvas.width = imageBitmap.width;
    canvas.height = imageBitmap.height;
    context.drawImage(imageBitmap, 0, 0);

    const imageData = context.getImageData(0, 0, imageBitmap.width, imageBitmap.height);

    worker.postMessage({
        id: DETECT_FACE_BOX,
        baseUrl: getAppBaseUrl(),
        imageData,
        threshold,
        isHorizontallyFlipped
    });
}

/** ..........
 * Gets face box for a participant id.
 *
 * @param {string} id - The participant id.
 * @param {Object} state - The redux state.
 * @returns {Object}
 */
export function getFaceBoxForId(id: string, state: Object) {
    return state['features/face-centering'].faceBoxes[id];
}

/** ..........
 * Gets the video object position for a participant id.
 *
 * @param {string} id - The participant id.
 * @param {Object} state - The redux state.
 * @returns {string}
 */
export function getVideoObjectPosition(id: string, state: Object) {
    const faceBox = getFaceBoxForId(id, state);

    if (faceBox) {
        const { left, right, top, bottom } = faceBox;

        const horizontalPos = 100 - Math.round((left + right) / 2, 100);
        const verticalPos = 100 - Math.round((top + bottom) / 2, 100);

        return `${horizontalPos}% ${verticalPos}%`;
    }

    return '50% 50%';
}
