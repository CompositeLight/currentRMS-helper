let transferOutInitAttempts = 0;
let transferOutCachedAssets = [];
let transferOutStylesInjected = false;
let transferOutSearchTimer = null;

export function initTransferOut() {
	if (document.querySelector('.helper-transfer-out-selected')) {
		return;
	}

	const actionMenu = document.querySelector('.quick-function-section .dropdown-menu');
	if (!actionMenu) {
		if (transferOutInitAttempts < 10) {
			transferOutInitAttempts += 1;
			setTimeout(initTransferOut, 500);
		}
		return;
	}

	injectTransferOutModal();

	const newItem = document.createElement('li');
	const newLink = document.createElement('a');
	newLink.href = '#';
	newLink.className = 'helper-transfer-out-selected';
	newLink.textContent = 'Transfer out';
	newLink.addEventListener('click', function(event) {
		event.preventDefault();
		event.stopPropagation();
		transferOutCachedAssets = getSelectedAssetsForTransferOut();
		openTransferOutModal(transferOutCachedAssets);
	});
	newItem.appendChild(newLink);

	const clearTransfer = actionMenu.querySelector('a[href*="destroy_transfer_item_assets"]');
	if (clearTransfer && clearTransfer.parentElement) {
		actionMenu.insertBefore(newItem, clearTransfer.parentElement);
	} else {
		actionMenu.appendChild(newItem);
	}
}

function injectTransferOutModal() {
	if (document.getElementById('helper-transfer-out-modal')) {
		return;
	}

	injectTransferOutStyles();

	const modal = document.createElement('div');
	modal.id = 'helper-transfer-out-modal';
	modal.className = 'transfer-out-modal hidden';
	modal.innerHTML = '<div class="transfer-out-modal-backdrop"></div>' +
		'<div class="transfer-out-modal-dialog">' +
		'  <div class="transfer-out-modal-header">' +
		'    <h4>Transfer out selected assets</h4>' +
		'    <button type="button" class="close" id="helper-transfer-out-close">×</button>' +
		'  </div>' +
		'  <div class="transfer-out-modal-body">' +
		'    <label for="helper-transfer-out-target">Destination opportunity</label>' +
		'    <input type="text" id="helper-transfer-out-target" class="form-control" placeholder="Search for an Opportunity...">' +
		'    <div class="transfer-out-results" id="helper-transfer-out-results"></div>' +
		'    <div class="transfer-out-summary" id="helper-transfer-out-summary"></div>' +
		'    <div class="transfer-out-note">Bulk/group items are ignored; select serialised assets only.</div>' +
		'    <div class="transfer-out-progress" id="helper-transfer-out-progress"></div>' +
		'    <hr class="transfer-out-divider">' +
		'    <div class="row transfer-out-toggles">' +
		'      <div class="col-md-4 col-sm-4">' +
		'        <div class="free-scan-input">' +
		'          <label for="helper-transfer-out-free-scan">Free Scan</label>' +
		'          <label class="checkbox toggle android" for="helper-transfer-out-free-scan" onclick="">' +
		'            <input name="helper_transfer_out_free_scan_hidden" type="hidden" value="0">' +
		'            <input class="boolean optional" id="helper-transfer-out-free-scan" name="helper-transfer-out-free-scan" type="checkbox" value="1">' +
		'            <p><span class="checkedtext" data-text="yes"></span><span class="uncheckedtext" data-text="no"></span></p>' +
		'            <a class="slide-button"></a>' +
		'          </label>' +
		'        </div>' +
		'      </div>' +
		'      <div class="col-md-6 col-sm-6">' +
		'        <label for="helper-transfer-out-mark-prepared">Mark as prepared</label>' +
		'        <label class="checkbox toggle android" for="helper-transfer-out-mark-prepared" onclick="">' +
		'          <input name="helper_transfer_out_mark_prepared_hidden" type="hidden" value="0">' +
		'          <input class="boolean optional" id="helper-transfer-out-mark-prepared" name="helper-transfer-out-mark-prepared" type="checkbox" value="1">' +
		'          <p><span class="checkedtext" data-text="yes"></span><span class="uncheckedtext" data-text="no"></span></p>' +
		'          <a class="slide-button"></a>' +
		'        </label>' +
		'      </div>' +
		'    </div>' +
		'  </div>' +
		'  <div class="transfer-out-modal-footer">' +
		'    <button type="button" class="btn" id="helper-transfer-out-cancel">Cancel</button>' +
		'    <button type="button" class="btn btn-primary" id="helper-transfer-out-confirm">Transfer</button>' +
		'  </div>' +
		'</div>';

	document.body.appendChild(modal);

	document.getElementById('helper-transfer-out-close').addEventListener('click', closeTransferOutModal);
	document.getElementById('helper-transfer-out-cancel').addEventListener('click', closeTransferOutModal);
	document.getElementById('helper-transfer-out-confirm').addEventListener('click', runTransferOutSelected);
	document.getElementById('helper-transfer-out-modal').addEventListener('click', function(event) {
		if (event.target === modal || event.target.classList.contains('transfer-out-modal-backdrop')) {
			closeTransferOutModal();
		}
	});
	const targetInput = document.getElementById('helper-transfer-out-target');
	if (targetInput) {
		targetInput.addEventListener('input', handleTransferOutSearchInput);
		targetInput.addEventListener('focus', handleTransferOutSearchInput);
	}
}

function injectTransferOutStyles() {
	if (transferOutStylesInjected) {
		return;
	}
	const style = document.createElement('style');
	style.textContent = `
.transfer-out-modal {
  position: fixed;
  inset: 0;
  z-index: 1051;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: auto;
}
.transfer-out-modal.hidden { display: none; }
.transfer-out-modal-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
}
.transfer-out-modal-dialog {
  position: relative;
  background: #fff;
  border-radius: 4px;
  padding: 16px;
  max-width: 480px;
  width: 90%;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.25);
  pointer-events: auto;
  z-index: 1;
  max-height: 85vh;
  overflow: hidden;
}
.transfer-out-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.transfer-out-modal-body {
  margin-bottom: 12px;
  max-height: 65vh;
  overflow-y: auto;
}
.transfer-out-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
.transfer-out-summary {
  margin-top: 8px;
  font-size: 13px;
  color: #444;
}
.transfer-out-progress {
  margin-top: 6px;
  font-size: 12px;
  color: #444;
}
.transfer-out-note {
  margin-top: 8px;
  font-size: 12px;
  color: #555;
}
.transfer-out-divider {
  border: 0;
  border-top: 1px solid #ddd;
  margin: 12px 0;
}
.transfer-out-results {
  max-height: 220px;
  overflow-y: auto;
  margin-top: 6px;
  border: 1px solid #bbb;
  border-radius: 6px;
  background: #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}
.transfer-out-result {
  padding: 8px;
  border-bottom: 1px solid #eee;
  cursor: pointer;
}
.transfer-out-result:last-child { border-bottom: none; }
.transfer-out-result:hover {
  background: #f4f4f4;
  border-left: 3px solid #3c8dbc;
  padding-left: 5px;
}
.transfer-out-result-title {
  font-weight: 600;
}
.transfer-out-result-meta {
  font-size: 12px;
  color: #555;
  margin-top: 2px;
}
.transfer-out-toggles { margin-top: 10px; }
.transfer-out-modal .checkbox.toggle.android {
  margin-left: 0 !important;
}
.transfer-out-modal .free-scan-input {
  margin-bottom: 0;
}
`;
	document.head.appendChild(style);
	transferOutStylesInjected = true;
}

function closeTransferOutModal() {
	const modal = document.getElementById('helper-transfer-out-modal');
	if (modal) {
		modal.classList.add('hidden');
		resetTransferOutStatus();
	}
}

function openTransferOutModal(selectedAssets) {
	const assets = Array.isArray(selectedAssets) ? selectedAssets : getSelectedAssetsForTransferOut();
	if (assets.length === 0) {
		makeToast('toast-warning', 'Select at least one asset to transfer out.', 4);
		return;
	}

	const summary = document.getElementById('helper-transfer-out-summary');
	if (summary) {
		let previewList = assets.slice(0, 5).map(function(asset) {
			if (asset.assetNumber) {
				return asset.assetNumber;
			}
			return 'Stock level ID ' + asset.stockLevelId;
		}).join(', ');

		if (assets.length > 5) {
			previewList += ' +' + (assets.length - 5) + ' more';
		}

		summary.textContent = 'Ready to move ' + assets.length + ' asset(s): ' + previewList;
	}

	const progress = document.getElementById('helper-transfer-out-progress');
	if (progress) {
		progress.style.whiteSpace = 'pre-wrap';
		progress.textContent = '';
	}

	const modal = document.getElementById('helper-transfer-out-modal');
	if (modal) {
		modal.classList.remove('hidden');
	}

	const targetInput = document.getElementById('helper-transfer-out-target');
	if (targetInput) {
		targetInput.focus();
	}
}

function resetTransferOutStatus() {
	const progress = document.getElementById('helper-transfer-out-progress');
	if (progress) {
		progress.textContent = '';
	}
	transferOutCachedAssets = [];
	const confirm = document.getElementById('helper-transfer-out-confirm');
	if (confirm) {
		confirm.disabled = false;
		confirm.textContent = 'Transfer';
	}

	const results = document.getElementById('helper-transfer-out-results');
	if (results) {
		results.innerHTML = '';
	}
}

function getSelectedAssetsForTransferOut() {
	const selected = Array.from(document.querySelectorAll('input.item-select:checked'));
	return selected.map(function(box) {
		return {
			stockLevelId: box.dataset.stockLevelId,
			assetNumber: box.dataset.assetNumber
		};
	}).filter(function(asset) {
		// Only allow serialised assets with an asset number.
		return asset.assetNumber && asset.assetNumber.trim() !== '';
	});
}

function getTransferOutBaseFields(targetId) {
	const quickForm = document.querySelector('form#quick_allocate');
	const getValue = function(name, fallback = '') {
		return quickForm && quickForm.querySelector('input[name="' + name + '"]') ? quickForm.querySelector('input[name="' + name + '"]').value : fallback;
	};
	const viewValue = getValue('view', 'd');
	const sortValue = getValue('sort', 'path');
	return {
		authenticityToken: document.querySelector('meta[name="csrf-token"]') ? document.querySelector('meta[name="csrf-token"]').getAttribute('content') : '',
		storeId: getValue('store_id', ''),
		view: viewValue,
		sort: sortValue,
		rp: '/opportunities/' + targetId + '?sort=' + sortValue + '&view=' + viewValue,
		mbClientId: getValue('mb_client_id', ''),
		groupScan: getValue('group_scan', '0'),
		groupId: getValue('group_id', '')
	};
}

function buildTransferOutPayload(targetId, asset) {
	const fields = getTransferOutBaseFields(targetId);
	const params = new URLSearchParams();
	params.set('authenticity_token', fields.authenticityToken);
	params.set('opportunity_id', targetId);
	params.set('store_id', fields.storeId || '');
	params.set('stock_level_id', asset.stockLevelId || '');
	params.set('stock_level_asset_number', asset.assetNumber || '');
	params.set('quantity', '1');
	params.set('container', '');
	const freeScanInput = document.getElementById('helper-transfer-out-free-scan');
	const markPreparedInput = document.getElementById('helper-transfer-out-mark-prepared');
	params.set('free_scan', freeScanInput && freeScanInput.checked ? '1' : '0');
	params.set('mark_as_prepared', markPreparedInput && markPreparedInput.checked ? '1' : '0');
	params.set('view', fields.view);
	params.set('sort', fields.sort);
	params.set('rp', fields.rp);
	params.set('mb_client_id', fields.mbClientId);
	params.set('group_scan', fields.groupScan);
	params.set('group_id', fields.groupId);
	return params;
}

function interpretTransferOutResponse(response, bodyText) {
	// Default to network-level result.
	if (!response.ok) {
		return { success: false, message: 'HTTP ' + response.status };
	}

	const lower = bodyText ? bodyText.toLowerCase() : '';
	let extractedMessage = null;
	let extractedDetail = null;

	// Try to pull out specific toastr error messages.
	if (lower.indexOf('toastr.error') !== -1) {
		const matches = bodyText.match(/toastr\.error\(["']([\s\S]*?)["']\)/gi) || [];
		if (matches.length > 0) {
			// First toastr.error is the title
			const first = matches[0].match(/toastr\.error\(["']([\s\S]*?)["']\)/i);
			if (first && first[1]) {
				extractedMessage = cleanTransferOutText(first[1]);
			}
			// Second (if present) is the detailed list
			if (matches.length > 1) {
				const second = matches[1].match(/toastr\.error\(["']([\s\S]*?)["']\)/i);
				if (second && second[1]) {
					const liMatches = second[1].match(/<li>([^<]+)<\/li>/gi);
					if (liMatches && liMatches.length > 0) {
						extractedDetail = liMatches.map(function(li) {
							return cleanTransferOutText(li);
						}).join(' | ');
					} else {
						extractedDetail = cleanTransferOutText(second[1]);
					}
				}
			}
		}
		return {
			success: false,
			message: extractedMessage || 'Transfer Out returned error',
			detail: extractedDetail || ''
		};
	}

	if (lower.indexOf('toastr.success') !== -1 || lower.indexOf('allocation successful') !== -1) {
		return { success: true, message: 'Transfer Out succeeded' };
	}

	// Fallback: treat HTTP success as success if no explicit error markers found.
	return { success: true, message: 'Transfer Out completed' };
}

function cleanTransferOutText(text) {
	return (text || '').replace(/<[^>]+>/g, '').replace(/\\/g, '').trim();
}

function handleTransferOutSearchInput(event) {
	const term = (event.target.value || '').trim();
	const results = document.getElementById('helper-transfer-out-results');
	if (results) {
		results.innerHTML = '';
	}
	event.target.dataset.selectedId = '';

	if (term.length < 2) {
		return;
	}

	if (transferOutSearchTimer) {
		clearTimeout(transferOutSearchTimer);
	}

	transferOutSearchTimer = setTimeout(function() {
		runTransferOutSearch(term);
	}, 300);
}

async function runTransferOutSearch(term) {
	const baseUrl = window.location.origin;
	const url = baseUrl + '/opportunities?q%5Bsubject_or_description_or_number_or_reference_or_member_name_or_tags_name_cont%5D=' + encodeURIComponent(term);
	let html = '';
	try {
		const response = await fetch(url, {
			method: 'GET',
			credentials: 'same-origin',
			headers: { 'Accept': 'text/html, */*;q=0.1' }
		});
		html = await response.text();
	} catch (err) {
		return;
	}

	const parser = new DOMParser();
	const doc = parser.parseFromString(html, 'text/html');
	const tbodies = doc.querySelectorAll('tbody.sortable');
	const results = [];

	tbodies.forEach(function(tbody) {
		const firstRow = tbody.querySelector('tr');
		const titleLink = tbody.querySelector('a.title');
		if (!firstRow || !titleLink) {
			return;
		}
		const idAttr = firstRow.id || '';
		const idMatch = idAttr.match(/id-(\d+)/);
		const oppId = idMatch ? idMatch[1] : null;
		if (!oppId) {
			return;
		}
		const orgLink = tbody.querySelector('.content-data a[data-rp]');
		const start = tbody.querySelector('td[data-label="Starts:"] time');
		const end = tbody.querySelector('td[data-label="Ends:"] time');
		results.push({
			id: oppId,
			title: titleLink.textContent.trim(),
			org: orgLink ? orgLink.textContent.trim() : '',
			start: start ? start.textContent.trim() : '',
			end: end ? end.textContent.trim() : ''
		});
	});

	renderTransferOutSearchResults(results);
}

function renderTransferOutSearchResults(items) {
	const container = document.getElementById('helper-transfer-out-results');
	const targetInput = document.getElementById('helper-transfer-out-target');
	if (!container || !targetInput) {
		return;
	}
	container.innerHTML = '';
	if (!items || items.length === 0) {
		container.innerHTML = '<div class="transfer-out-result">No matches</div>';
		return;
	}

	items.slice(0, 10).forEach(function(item) {
		const row = document.createElement('div');
		row.className = 'transfer-out-result';
		row.innerHTML = '<div class="transfer-out-result-title">' + item.title + '</div>' +
			'<div class="transfer-out-result-meta">' + [item.org, [item.start, item.end].filter(Boolean).join(' → ')].filter(Boolean).join(' • ') + '</div>';
		row.addEventListener('click', function() {
			targetInput.value = item.title;
			targetInput.dataset.selectedId = item.id;
			container.innerHTML = '';
		});
		container.appendChild(row);
	});
}

async function runTransferOutSelected() {
	const progress = document.getElementById('helper-transfer-out-progress');
	const setConfirm = function(text, disabled) {
		const button = document.getElementById('helper-transfer-out-confirm');
		if (button) {
			button.textContent = text;
			button.disabled = !!disabled;
		}
	};
	const bail = function(message, buttonText) {
		if (progress) {
			progress.textContent = message;
			progress.style.color = '#b12a0b';
		}
		setConfirm(buttonText || 'Transfer', false);
	};
	setConfirm('Working...', true);
	if (progress) {
		progress.style.color = '#444';
	}

	const targetInput = document.getElementById('helper-transfer-out-target');
	const targetId = targetInput ? targetInput.dataset.selectedId || '' : '';
	if (!targetId) return bail('Select a destination opportunity.');

	const assets = transferOutCachedAssets.length ? transferOutCachedAssets : getSelectedAssetsForTransferOut();
	if (assets.length === 0) return bail('Select at least one asset before allocating (bulk/group booking items are ignored).');

	const baseUrl = window.location.origin;
	const errors = [];

	for (let i = 0; i < assets.length; i++) {
		const asset = assets[i];
		const payload = buildTransferOutPayload(targetId, asset);
		try {
			const response = await fetch(baseUrl + '/opportunities/' + targetId + '/quick_allocate', {
				method: 'POST',
				credentials: 'same-origin',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
					'Accept': 'text/javascript, text/html, application/json, */*; q=0.01',
					'X-Requested-With': 'XMLHttpRequest',
					'X-CSRF-Token': payload.get('authenticity_token')
				},
				body: payload
			});

			const responseText = await response.text();
			const interpretation = interpretTransferOutResponse(response, responseText);

			if (!interpretation.success) {
				const detailText = interpretation.detail || interpretation.message || 'Transfer Out returned error';
				errors.push((asset.assetNumber || asset.stockLevelId || 'Unknown asset') + ' failed: ' + detailText);
			}
		} catch (err) {
			errors.push((asset.assetNumber || asset.stockLevelId || 'Unknown asset') + ' failed: ' + err);
		}

		if (progress) {
			progress.textContent = 'Processed ' + (i + 1) + '/' + assets.length;
			progress.style.color = '#444';
		}
	}

	if (errors.length === 0) {
		makeToast('toast-success', 'Transferred ' + assets.length + ' asset(s) to opportunity ' + targetId + '.', 5);
		closeTransferOutModal();
	} else {
		const errorMessage = errors.join('\n');
		const modalMessage = 'Finished with ' + errors.length + ' error(s):\n' + errors.join('\n');
		const toastHtml = errorMessage.replace(/\n/g, '<br>');
		makeToast('toast-warning', toastHtml, 0);
		if (progress) {
			progress.style.whiteSpace = 'pre-wrap';
			progress.style.color = '#b12a0b';
			progress.textContent = modalMessage;
		}
		setConfirm('Retry', false);
	}
}
