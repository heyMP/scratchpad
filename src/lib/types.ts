/**
 * Defines the parameters for rerouting a URL.
 * This type is a union of two possible structures:
 */
export type RerouteUrlParams =
  | {
    /**
     * Rerouting a url to a different url.
     */
    type: 'url';
    /**
     * The target url that you want to reroute.
     */
    target: string;
    /**
     * The url that you want to reroute the target to.
     */
    source: string;
  }
  | {
    /**
     *Rerouting a url to a path on your local file system.
     */
    type: 'path';
    /**
     * The target url that you want to reroute.
     */
    target: string;
    /**
     * The path on your local file system that you want to reroute the target to.
     */
    source: string;
  };
