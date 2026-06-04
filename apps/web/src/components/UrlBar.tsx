import { Icon } from "./Icon";

export function UrlBar({
  url,
  loading,
}: {
  url: { host: string; path: string };
  loading: boolean;
}) {
  const secure = (url.host || "").includes(".");
  return (
    <div className="urlbar">
      {secure ? (
        <span className="lock">
          <Icon name="lock" size={12} />
        </span>
      ) : null}
      <span className="url-text">
        <b>{url.host}</b>
        {url.path}
      </span>
      {loading ? <span className="url-load" /> : null}
    </div>
  );
}
