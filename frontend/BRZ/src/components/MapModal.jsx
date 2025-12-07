import React, { useEffect, useRef, useState } from 'react';
import { X, Check, MapPin, Loader2 } from 'lucide-react';

const MapModal = ({ isOpen, onClose, currentCoords, onSaveLocation }) => {
	if (!isOpen) return null;

	const mapElementRef = useRef(null);
	const mapObjectRef = useRef(null);
	const markerObjectRef = useRef(null);
	const [loading, setLoading] = useState(true);
	const [newCoords, setNewCoords] = useState(currentCoords);
	const [address, setAddress] = useState('Ładowanie adresu...');

	const geocode = (latLng) => {
		if (!window.google || !window.google.maps || !window.google.maps.Geocoder)
			return;

		const geocoder = new window.google.maps.Geocoder();
		geocoder.geocode({ location: latLng }, (results, status) => {
			if (status === 'OK' && results[0]) {
				setAddress(results[0].formatted_address);
			} else {
				setAddress('Nie znaleziono adresu.');
			}
		});
	};

	useEffect(() => {
		if (!isOpen || !window.google || !window.google.maps) return;

		setLoading(true);

		const latLng = new window.google.maps.LatLng(newCoords.lat, newCoords.lng);

		mapObjectRef.current = new window.google.maps.Map(mapElementRef.current, {
			center: latLng,
			zoom: 17,
			mapTypeControl: false,
			streetViewControl: false,
		});

		markerObjectRef.current = new window.google.maps.Marker({
			position: latLng,
			map: mapObjectRef.current,
			draggable: true,
			title: 'Przeciągnij, aby ustawić dokładną lokalizację',
		});

		markerObjectRef.current.addListener('dragend', () => {
			const newPosition = markerObjectRef.current.getPosition();
			const lat = newPosition.lat();
			const lng = newPosition.lng();
			setNewCoords({ lat, lng });
			geocode(newPosition);
		});

		geocode(latLng);

		setLoading(false);
	}, [isOpen]);

	const handleSave = () => {
		onSaveLocation(address, newCoords);
		onClose();
	};

	return (
		<div className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
			<div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col transform scale-95 animate-in zoom-in duration-300">
				<div className="flex justify-between items-center p-4 border-b border-slate-100">
					<h3 className="text-xl font-bold text-slate-800 flex items-center gap-3">
						<MapPin className="text-red-600" size={24} />
						Ustaw precyzyjną lokalizację
					</h3>
					<button
						onClick={onClose}
						className="text-slate-500 hover:text-slate-800 p-2 rounded-full hover:bg-slate-100 transition-colors"
					>
						<X size={24} />
					</button>
				</div>

				<div className="p-4 bg-slate-50 border-b border-slate-100">
					<p className="text-sm font-medium text-slate-700">
						Adres na podstawie pinezki:
					</p>
					<p className="font-semibold text-lg text-blue-900 break-words">
						{address}
					</p>
				</div>

				<div className="flex-grow relative">
					<div
						ref={mapElementRef}
						id="full-map-container"
						className="h-full w-full"
					>
					</div>
					{loading && (
						<div className="absolute inset-0 bg-white/80 flex items-center justify-center text-blue-600">
							<Loader2 className="w-8 h-8 animate-spin mr-2" /> Ładowanie
							mapy...
						</div>
					)}
				</div>

				<div className="p-4 border-t border-slate-100 flex justify-end gap-3">
					<button
						onClick={onClose}
						className="px-6 py-2 rounded-lg text-slate-600 font-medium hover:bg-slate-100 transition-colors"
					>
						Anuluj
					</button>
					<button
						onClick={handleSave}
						className="px-6 py-2 rounded-lg bg-green-600 text-white font-bold hover:bg-green-700 transition-colors flex items-center gap-2"
						disabled={loading}
					>
						<Check size={18} /> Zapisz lokalizację
					</button>
				</div>
			</div>
		</div>
	);
};

export default MapModal;
