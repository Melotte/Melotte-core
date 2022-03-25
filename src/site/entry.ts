// The entry is like the address of a site. It leads to the metadata and mgmt chain.
// Mgmt chain points to other components of a site

export interface Entry {
    publickey: string[] // Moderators of a site
}