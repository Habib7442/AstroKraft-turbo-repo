import Script from "next/script";
import { META_PIXEL_ID } from "@/lib/site";

/** Meta Pixel base code + PageView. Renders nothing when no pixel id is configured. */
export function MetaPixel() {
  if (!META_PIXEL_ID) return null;
  const cleanId = META_PIXEL_ID.replace(/\D/g, "");
  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${cleanId}');fbq('track','PageView');`}
      </Script>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${cleanId}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}

type Fbq = (...args: unknown[]) => void;

/** Fire a standard pixel event; eventId lets Meta dedupe it against the CAPI copy. */
export function trackPixel(event: string, params: Record<string, unknown> = {}, eventId?: string) {
  const fbq = (window as unknown as { fbq?: Fbq }).fbq;
  if (!fbq) return;
  fbq("track", event, params, eventId ? { eventID: eventId } : undefined);
}
