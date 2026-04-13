// Maps a user's role to their default landing dashboard route.
export const getRoleHomePath = (user) => {
    if (!user) return '/';
    const role = user.role;
    const country = user.country || "Australia";
    const isNZ = country === "New Zealand" || country === "Newzealand" || country === "NZ";

    switch (role) {
        case 'admin': return '/admin';
        case 'dealer': return isNZ ? '/dealer-page-nz' : '/dealer-page';
        case 'representative': return isNZ ? '/representative-page-nz' : '/representative-page';
        case 'influencer': return isNZ ? '/influencer-page-nz' : '/influencer-page';
        case 'staff': return isNZ ? '/home-nz' : '/home';
        default: return isNZ ? '/home-nz' : '/home';
    }
};
