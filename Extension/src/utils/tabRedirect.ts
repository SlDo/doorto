export const tabRedirect = (href: string | undefined) => {
  if (href != null) {
    chrome.tabs.create({ url: href });
  }
};
