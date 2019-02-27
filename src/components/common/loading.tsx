import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { HTMLAttributes } from 'react';
import styled from 'styled-components';

interface Props extends HTMLAttributes<HTMLDivElement> {}

export const Loading: React.FC = props => {
    return (
        <div {...props}>
            <FontAwesomeIcon icon="spinner" spin={true} />
        </div>
    );
};

const LoadingWrapper = styled.div`
    min-height: 200px;
    position: relative;
`;

const CenteredLoading = styled(Loading)`
    left: 50%;
    position: absolute;
    top: 50%;
    transform: translate(-50%, -50%);
`;

export const CardLoading: React.FC<Props> = props => {
    const { ...restProps } = props;

    return (
        <LoadingWrapper {...restProps}>
            <CenteredLoading />
        </LoadingWrapper>
    );
};
