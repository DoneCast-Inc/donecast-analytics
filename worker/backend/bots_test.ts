import { assert, assertEquals } from '../tests/deps.ts';
import { computeBotType, isBotIpHash } from './bots.ts';

Deno.test({
    name: 'computeBotType-datacenter',
    fn: () => {
        const date = '2026-07-21';
        // browser UA from a hosting ASN = scraper
        assertEquals(computeBotType({ agentType: 'browser', agentName: 'Chrome', deviceType: 'computer', date, asn: '45102' }), 'datacenter'); // alibaba
        assertEquals(computeBotType({ agentType: 'browser', agentName: 'Chrome', deviceType: 'computer', date, asn: '32934' }), 'datacenter'); // meta
        assertEquals(computeBotType({ agentType: 'unknown', agentName: 'SomethingElse/1.0', date, asn: '16509' }), 'datacenter'); // aws
        // browser on a consumer ASN, coming from a web-player page (has referrer) = counted
        assertEquals(computeBotType({ agentType: 'browser', agentName: 'Chrome', deviceType: 'computer', referrerName: 'podcasts.apple.com', date, asn: '7018' }), undefined); // at&t
        assertEquals(computeBotType({ agentType: 'browser', agentName: 'Chrome', deviceType: 'computer', referrerName: 'podcasts.apple.com', date }), undefined); // no asn recorded
        // desktop browser with NO referrer = residential-proxy scraper
        assertEquals(computeBotType({ agentType: 'browser', agentName: 'Chrome', deviceType: 'computer', date, asn: '7018' }), 'desktop-browser-sans-referrer');
        // mobile browser with no referrer = counted (shared-link plays on phones)
        assertEquals(computeBotType({ agentType: 'browser', agentName: 'Safari', deviceType: 'mobile', date, asn: '7018' }), undefined);
        // our own diagnostic probes never count
        assertEquals(computeBotType({ agentType: 'unknown', agentName: 'Mozilla/5.0 DonecastDiag test 1', date }), 'self-test');
        // known apps + device media libraries are never excluded by ASN (VPN/private-relay listeners)
        assertEquals(computeBotType({ agentType: 'app', agentName: 'Apple Podcasts', deviceType: 'mobile', date, asn: '45102' }), undefined);
        assertEquals(computeBotType({ agentType: 'library', agentName: 'AppleCoreMedia', date, asn: '13335' }), undefined);
        // earlier rules still win over the asn rule
        assertEquals(computeBotType({ agentType: 'bot', agentName: 'Googlebot', date, asn: '45102' }), 'bot');
        assertEquals(computeBotType({ agentType: 'browser', agentName: '', date, asn: '45102' }), 'no-ua');
    }
});

Deno.test({
    name: 'isBotIpHash',
    fn: () => {
        const date = '2025-01-01';
        assert(isBotIpHash({ hashedIpAddress: '5a8ce5c15b702fb94c8684d273ffb51d3c0383c4', agentName: '', asn: '', destinationServerUrl: '', deviceName: '', regionCode: '', date }));
        assert(!isBotIpHash({ hashedIpAddress: '5a8ce5c15b702fb94c8684d273ffb51d3c0383c3', agentName: '', asn: '', destinationServerUrl: '', deviceName: '', regionCode: '', date }));
   
        assert(isBotIpHash({ hashedIpAddress: 'asdf', agentName: 'Chrome', asn: '16591', destinationServerUrl: 'https://ondemand.kut.org/fdd/audio/download/kut/kut-news-now/20250124_KNN_PM.mp3?awCollectionId=gKeijBW&awEpisodeId=20250124_KNN_PM&ignore=mc.blubrry.com', deviceName: 'Windows Computer', regionCode: 'TX', date }));
        assert(!isBotIpHash({ hashedIpAddress: 'asdf', agentName: 'Chrome', asn: '16590', destinationServerUrl: 'https://ondemand.kut.org/fdd/audio/download/kut/kut-news-now/20250124_KNN_PM.mp3?awCollectionId=gKeijBW&awEpisodeId=20250124_KNN_PM&ignore=mc.blubrry.com', deviceName: 'Windows Computer', regionCode: 'TX', date }));
        assert(!isBotIpHash({ hashedIpAddress: 'asdf', agentName: 'Chrome', asn: '16591', destinationServerUrl: 'https://example.com/fdd/audio/download/kut/kut-news-now/20250124_KNN_PM.mp3?awCollectionId=gKeijBW&awEpisodeId=20250124_KNN_PM&ignore=mc.blubrry.com', deviceName: 'Windows Computer', regionCode: 'TX', date }));
        assert(!isBotIpHash({ hashedIpAddress: 'asdf', agentName: 'Chrome', asn: '16591', destinationServerUrl: 'https://ondemand.kut.org/fdd/audio/download/kut/another/20250124_KNN_PM.mp3?awCollectionId=gKeijBW&awEpisodeId=20250124_KNN_PM&ignore=mc.blubrry.com', deviceName: 'Windows Computer', regionCode: 'TX', date }));
        assert(!isBotIpHash({ hashedIpAddress: 'asdf', agentName: 'Chrome', asn: '16591', destinationServerUrl: 'https://ondemand.kut.org/fdd/audio/download/kut/kut-news-now/20250124_KNN_PM.mp3?awCollectionId=gKeijBW&awEpisodeId=20250124_KNN_PM&ignore=mc.blubrry.com', deviceName: 'Windows Computer', regionCode: 'OH', date }));

    }
});
