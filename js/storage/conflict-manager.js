(function () {
  function detect(localItem, remoteItem) {
    if (!localItem || !remoteItem) return null;
    const localModified = new Date(localItem.updatedAt || localItem.modifiedAt || localItem.createdAt || 0).getTime();
    const remoteModified = new Date(remoteItem.updatedAt || remoteItem.modifiedAt || remoteItem.createdAt || 0).getTime();
    if (localModified === remoteModified) return null;
    return { local: localItem, remote: remoteItem, localModified, remoteModified };
  }

  function resolve(conflict, mode = "keep-local") {
    if (!conflict) return null;
    if (mode === "keep-remote") return Utils.deepClone(conflict.remote);
    if (mode === "create-copy") return { ...Utils.deepClone(conflict.remote), id: Utils.uid("copy"), conflictCopy: true };
    return Utils.deepClone(conflict.local);
  }

  window.ConflictManager = { detect, resolve };
})();
