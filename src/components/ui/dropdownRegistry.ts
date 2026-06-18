type CloseFn = () => void;

let activeDropdownClose: CloseFn | null = null;

export const requestDropdownOpen = (closeSelf: CloseFn) => {
  if (activeDropdownClose && activeDropdownClose !== closeSelf) {
    activeDropdownClose();
  }
  activeDropdownClose = closeSelf;
};

export const releaseDropdown = (closeSelf: CloseFn) => {
  if (activeDropdownClose === closeSelf) {
    activeDropdownClose = null;
  }
};
