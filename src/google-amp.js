const URL_PATTERN_REGEX = /^https?:\/\/.+/i;
const expando = `__${Math.random()}`;
const HTTPS = 'https://';

/**
 * Hide AMP icon for AMP element in google search results
 * @param amp element
 */
const hideAmpIcon = (amp) => {
    const ampIcon = amp.querySelector('[aria-label="AMP logo"], [aria-label="Logo AMP"]');
    if (ampIcon) {
        ampIcon.style.display = 'none';
    }
};

/**
 * Redirects amp version to normal
 */
export const ampRedirect = () => {
    const DISABLE_AMP_REDIRECTED = '__disable_amp_redirected';
    // timeout to prevent automatic redirects to amp
    const REDIRECT_WAIT_TIME_OUT_MS = 30000;
    const disableAmpRedirectedDate = Number(sessionStorage.getItem(DISABLE_AMP_REDIRECTED));
    if (
        // Prevent redirecting to another page if run in an iframe
        window.self !== window.top
        // Do not redirect if since last redirect past less than REDIRECT_WAIT_TIME_OUT_MS
        || (disableAmpRedirectedDate
            && Date.now() - disableAmpRedirectedDate < REDIRECT_WAIT_TIME_OUT_MS)
    ) {
        return;
    }
    const canonicalLink = document.querySelector('head > link[rel="canonical"]');
    const ampProjectScript = document.querySelector('head > script[src^="https://cdn.ampproject.org"]');
    if (ampProjectScript && canonicalLink && URL_PATTERN_REGEX.test(canonicalLink.href)) {
        sessionStorage.setItem(DISABLE_AMP_REDIRECTED, Date.now());
        window.top.location.href = canonicalLink.href;
    }
};

/**
 * Replaces amp links by data-amp-cur attribute value
 */
const replaceByAmpCurAttribute = () => {
    const AMP_MARKER_REGEX = /(amp\/|amp-|\.amp)/;

    const sanitizeLink = (el, url) => {
        el.setAttribute('href', url);

        el.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            // https://github.com/AdguardTeam/DisableAMP/pull/15
            document.location.href = url;
        }, true);
        hideAmpIcon(el);
    };

    const sanitizeUrl = (ampUrl) => ampUrl.replace(AMP_MARKER_REGEX, '');

    const elements = document.querySelectorAll('a.amp_r[data-amp-cur]');
    [...elements].forEach((el) => {
        if (el[expando]) {
            return;
        }

        // eslint-disable-next-line no-param-reassign
        el[expando] = true;

        const canonicalUrl = el.getAttribute('data-amp-cur');
        if (canonicalUrl) {
            sanitizeLink(el, canonicalUrl);
            return;
        }

        const ampUrl = el.getAttribute('data-amp');
        if (ampUrl) {
            const cleanUrl = sanitizeUrl(ampUrl);
            sanitizeLink(el, cleanUrl);
        }
    });
};

/**
 * Replaces amp links provided by amp cdn
 */
const replaceCdnAmp = () => {
    const ampLinks = document.querySelectorAll('a[data-amp-cdn]');
    ampLinks.forEach((ampLink) => {
        let fixedUrl = ampLink.href;

        if (fixedUrl.includes('cdn.ampproject.org')) {
            fixedUrl = HTTPS + fixedUrl.substr(fixedUrl.indexOf('cdn.ampproject.org/wp/s/') + 24);
        }

        if (fixedUrl.substr(8).startsWith('amp.')) {
            fixedUrl = HTTPS + fixedUrl.substr(12);
        }

        fixedUrl = fixedUrl.replace('?amp&', '?&');

        if (fixedUrl !== ampLink.href) {
            ampLink.setAttribute('href', fixedUrl);

            ampLink.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                document.location.href = fixedUrl;
            }, true);
            hideAmpIcon(ampLink);
        }
    });
};

const preventAmp = () => {
    replaceByAmpCurAttribute();
    replaceCdnAmp();
};

export default preventAmp;
