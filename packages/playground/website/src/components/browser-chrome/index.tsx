import React from 'react';
import css from './style.module.css';
import AddressBar from '../address-bar';
import classNames from 'classnames';
import { OpenSiteManagerButton } from '../open-site-manager-button';
import {
	useAppSelector,
	getActiveClientInfo,
	useActiveSite,
} from '../../lib/state/redux/store';
import { SyncLocalFilesButton } from '../sync-local-files-button';
import { Dropdown, Icon } from '@wordpress/components';
import { cog } from '@wordpress/icons';
import Button from '../button';
import { ActiveSiteSettingsForm } from '../site-manager/site-settings-form';

interface BrowserChromeProps {
	children?: React.ReactNode;
	hideToolbar?: boolean;
	className?: string;
}

function MoneIcon() {
	return (
		<svg
			width="30"
			height="16"
			viewBox="0 0 30 16"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				d="M0.968238 15.9302C0.85421 15.9302 0.740168 15.9086 0.62614 15.8685C0.126882 15.6805 -0.125815 15.1197 0.0621767 14.6204C0.564517 13.2921 5.09173 1.60277 9.70833 0.160479C11.3355 -0.348022 12.9812 0.360799 14.328 2.16058C14.479 2.3609 14.6239 2.57663 14.7656 2.80161C15.8073 1.58428 16.9784 0.622754 18.245 0.252935C19.3791 -0.0799023 20.4794 0.068026 21.5118 0.696718C23.6074 1.96951 23.6537 4.78938 23.6937 7.2795C23.7245 9.15633 23.7584 11.0948 24.6152 11.9515C25.2007 12.5371 25.589 12.5309 25.8418 12.4693C26.7848 12.2474 27.771 10.6849 28.1162 9.64018C28.2857 9.13476 28.825 8.85739 29.3397 9.02998C29.8451 9.19948 30.1194 9.74804 29.9498 10.2535C29.5461 11.4677 28.2579 13.8869 26.2825 14.3523C25.5397 14.5279 24.4149 14.491 23.2407 13.3199C21.8292 11.9084 21.7891 9.56929 21.7521 7.31032C21.7152 5.12838 21.6813 3.06972 20.5009 2.35166C19.9369 2.00957 19.3915 1.93561 18.7844 2.11127C17.8413 2.38864 16.7873 3.28853 15.721 4.69693C17.0616 7.93284 17.5208 12.1611 16.1309 14.2475C14.9074 16.0812 13.3634 16.0935 12.4142 15.548C10.6883 14.5588 9.86857 11.366 11.5451 7.92976C12.0844 6.82339 12.7439 5.61531 13.499 4.48736C13.2771 4.06515 13.0336 3.67376 12.7748 3.32551C11.9334 2.20065 11.0982 1.75687 10.2815 2.01266C7.48016 2.8879 3.63402 10.6325 1.86813 15.3077C1.72637 15.6898 1.35963 15.9302 0.968238 15.9302ZM14.4051 6.69087C14.0291 7.3288 13.6562 8.0253 13.2894 8.77726C12.0105 11.3968 12.6607 13.4524 13.3819 13.8684C13.8257 14.1273 14.328 13.4678 14.5252 13.1719C15.3327 11.9639 15.1878 9.19947 14.4051 6.69087Z"
				fill="#fff"
			/>
			<path
				d="M8.78625 8.9055C9.39389 8.9055 9.88645 8.41292 9.88645 7.80529C9.88645 7.19766 9.39389 6.70508 8.78625 6.70508C8.17862 6.70508 7.68604 7.19766 7.68604 7.80529C7.68604 8.41292 8.17862 8.9055 8.78625 8.9055Z"
				fill="#fff"
			/>
			<path
				d="M19.0304 8.9055C19.638 8.9055 20.1306 8.41292 20.1306 7.80529C20.1306 7.19766 19.638 6.70508 19.0304 6.70508C18.4228 6.70508 17.9302 7.19766 17.9302 7.80529C17.9302 8.41292 18.4228 8.9055 19.0304 8.9055Z"
				fill="#fff"
			/>
		</svg>
	);
}

export default function BrowserChrome({
	children,
	hideToolbar,
	className,
}: BrowserChromeProps) {
	const clientInfo = useAppSelector(getActiveClientInfo);
	const activeSite = useActiveSite();
	const showAddressBar = !!clientInfo;
	const url = clientInfo?.url;
	const addressBarClass = classNames(css.addressBarSlot, {
		[css.isHidden]: !showAddressBar,
	});
	const wrapperClass = classNames(
		css.wrapper,
		css.hasFullSizeWindow,
		className
	);

	return (
		<div className={wrapperClass} data-cy="simulated-browser">
			<div className={`${css.window} browser-chrome-window`}>
				<header
					className={`
						${css.toolbar}
						${hideToolbar ? css.toolbarHidden : ''}
					`}
					aria-label="Playground toolbar"
				>
					{/* <div className={css.windowControls}>
						<OpenSiteManagerButton />
					</div> */}

					<div className={css.windowControls}>
						<a
							href="https://mone-wp.com/"
							target="_blank"
							rel="noreferrer"
						>
							<MoneIcon />
						</a>
					</div>

					<div className={addressBarClass}>
						<AddressBar
							url={url}
							onUpdate={(newUrl) =>
								clientInfo?.client.goTo(newUrl)
							}
						/>
					</div>

					{/* <div className={css.toolbarButtons}>
						<Dropdown
							className="my-container-class-name"
							contentClassName="my-dropdown-content-classname"
							popoverProps={{ placement: 'bottom-start' }}
							renderToggle={({ isOpen, onToggle }) => (
								<Button
									variant="browser-chrome"
									aria-label="Edit Playground settings"
									onClick={onToggle}
									aria-expanded={isOpen}
									style={{
										padding: '0 10px',
										fill: '#FFF',
										alignItems: 'center',
										display: 'flex',
									}}
								>
									<Icon icon={cog} />
								</Button>
							)}
							renderContent={({ onClose }) => (
								<div
									style={{
										width: 400,
										maxWidth: '100vw',
										padding: 0,
									}}
								>
									<div className={css.headerSection}>
										<h2 style={{ margin: 0 }}>
											Playground settings
										</h2>
									</div>
									<ActiveSiteSettingsForm
										onSubmit={onClose}
									/>
								</div>
							)}
						/>
						{activeSite?.metadata?.storage === 'local-fs' ? (
							<SyncLocalFilesButton />
						) : null}
					</div> */}
				</header>
				<div className={css.content}>{children}</div>
			</div>
		</div>
	);
}
