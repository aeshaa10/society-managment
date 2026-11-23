import { getStatusBadge, capitalize } from '../../utils/helpers';

export default function Badge({ status, label }) {
  const cls = getStatusBadge(status);
  return (
    <span className={`badge ${cls}`}>
      {label || capitalize(status)}
    </span>
  );
}
